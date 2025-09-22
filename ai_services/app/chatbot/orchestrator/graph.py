# app/chatbot/orchestrator/graph.py
from langgraph.graph import StateGraph, END
from app.chatbot.agents.safety import SafetyGuardAgent
from app.chatbot.agents.retriever import QdrantRetrieverAgent
from app.chatbot.agents.reasoning import ReasoningAgent
from app.chatbot.agents.translator import TranslatorAgent
from app.chatbot.agents.advice import AdviceAgent
from app.chatbot.agents.summarizer import SummarizerAgent
from app.chatbot.agents.faithfulness import FaithfulnessCheckerAgent
from app.chatbot.memory.conversation import ConversationMemory
from app.chatbot.memory.long_term import LongTermMemory

conv_memory = ConversationMemory()
long_memory = LongTermMemory()

def build_chatbot_graph():
    workflow = StateGraph(dict)

    safety = SafetyGuardAgent()
    retriever = QdrantRetrieverAgent()
    reasoning = ReasoningAgent()
    translator = TranslatorAgent()
    advice = AdviceAgent()
    summarizer = SummarizerAgent()
    faithfulness = FaithfulnessCheckerAgent()

    workflow.add_node("safety", safety.run)
    workflow.add_node("retriever", retriever.run)
    workflow.add_node("reasoning", reasoning.run)
    workflow.add_node("translator", translator.run)
    workflow.add_node("advice", advice.run)
    workflow.add_node("summarizer", summarizer.run)
    workflow.add_node("faithfulness", faithfulness.run)

    workflow.set_entry_point("safety")
    workflow.add_edge("safety", "retriever")
    workflow.add_edge("retriever", "reasoning")
    workflow.add_edge("reasoning", "translator")
    workflow.add_edge("translator", "advice")
    workflow.add_edge("advice", "summarizer")
    workflow.add_edge("summarizer", "faithfulness")
    workflow.add_edge("faithfulness", END)

    return workflow.compile()


def inject_memory(state: dict) -> dict:
    """Inject short- and long-term memory into the pipeline state."""
    user_id, case_id = state.get("user_id"), state.get("case_id")

    # Load short-term history
    short_turns = conv_memory.load(user_id, case_id, limit=3)
    state["history"] = [
        f"User: {h['query']}\nAssistant: {h['answer']}" for h in reversed(short_turns)
    ]

    # Load long-term summaries
    long_turns = long_memory.search(state["query"], user_id, case_id)
    state["long_memory"] = long_turns

    return state
