"""
BlackBox Client — Non-blocking trace recorder
Stores traces asynchronously in Supabase (Postgres) or local store fallback.
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import httpx

from blackbox.sdk.schema import Run, Step, EvalResult

logger = logging.getLogger("blackbox.client")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORE_FILE = os.path.join(DATA_DIR, "store.json")

class BlackBoxClient:
    """Async trace client for BlackBox telemetry."""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.is_supabase_ready = bool(self.supabase_url and self.supabase_key)
        
        # Ensure local store file exists
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(STORE_FILE):
            self._init_local_store()

    def _init_local_store(self):
        initial_data = {
            "runs": {},
            "steps": [],
            "evals": [],
        }
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(initial_data, f, indent=2)

    def _read_local_store(self) -> Dict[str, Any]:
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading local BlackBox store: {e}")
            return {"runs": {}, "steps": [], "evals": []}

    def _write_local_store(self, data: Dict[str, Any]):
        try:
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing local BlackBox store: {e}")

    async def save_run_async(self, run: Run):
        """Async non-blocking write for a completed or active run."""
        asyncio.create_task(self._save_run(run))

    async def _save_run(self, run: Run):
        try:
            run_dict = run.model_dump()
            
            # 1. Store in local JSON store
            store = self._read_local_store()
            store["runs"][run.run_id] = run_dict
            self._write_local_store(store)

            # 2. If Supabase configured, push to REST API asynchronously
            if self.is_supabase_ready:
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates",
                }
                url = f"{self.supabase_url}/rest/v1/runs"
                async with httpx.AsyncClient(timeout=5.0) as http_client:
                    await http_client.post(url, headers=headers, json=run_dict)
        except Exception as e:
            logger.warning(f"Non-fatal BlackBox trace write error: {e}")

    async def save_step_async(self, step: Step):
        """Async non-blocking write for a single trace step."""
        asyncio.create_task(self._save_step(step))

    async def _save_step(self, step: Step):
        try:
            step_dict = step.model_dump()
            store = self._read_local_store()
            store["steps"].append(step_dict)
            
            # Link to run if run exists locally
            if step.run_id in store["runs"]:
                run_data = store["runs"][step.run_id]
                # append step if not already present
                existing_ids = [s.get("step_id") for s in run_data.get("steps", [])]
                if step.step_id not in existing_ids:
                    run_data.setdefault("steps", []).append(step_dict)
                    run_data["total_steps"] = len(run_data["steps"])
                    run_data["total_latency_ms"] += step.latency_ms
                    run_data["total_tokens"] += step.total_tokens
                    run_data["total_cost"] += step.estimated_cost

            self._write_local_store(store)

            if self.is_supabase_ready:
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                }
                url = f"{self.supabase_url}/rest/v1/steps"
                async with httpx.AsyncClient(timeout=5.0) as http_client:
                    await http_client.post(url, headers=headers, json=step_dict)
        except Exception as e:
            logger.warning(f"Non-fatal BlackBox step write error: {e}")

    async def save_eval_result(self, eval_result: EvalResult):
        try:
            eval_dict = eval_result.model_dump()
            store = self._read_local_store()
            store["evals"].append(eval_dict)
            self._write_local_store(store)
        except Exception as e:
            logger.warning(f"Error saving eval result: {e}")

    def get_runs(self, limit: int = 50) -> List[Dict[str, Any]]:
        store = self._read_local_store()
        runs_list = list(store.get("runs", {}).values())
        runs_list.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
        return runs_list[:limit]

    def get_run_by_id(self, run_id: str) -> Optional[Dict[str, Any]]:
        store = self._read_local_store()
        return store.get("runs", {}).get(run_id)

    def get_evals(self, limit: int = 100) -> List[Dict[str, Any]]:
        store = self._read_local_store()
        evals_list = store.get("evals", [])
        evals_list.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
        return evals_list[:limit]

# Global Client Instance
blackbox_client = BlackBoxClient()
