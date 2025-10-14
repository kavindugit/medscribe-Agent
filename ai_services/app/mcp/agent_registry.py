# app/mcp/agent_registry.py
from app.mcp.insight_agent import run_insight_agent_mcp

AGENT_REGISTRY = {
    "insight_agent": run_insight_agent_mcp,
}

async def run_agent(name: str, **kwargs):
    if name not in AGENT_REGISTRY:
        raise ValueError(f"Unknown agent: {name}")
    return await AGENT_REGISTRY[name](**kwargs)
