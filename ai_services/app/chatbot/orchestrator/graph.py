from langgraph.graph import StateGraph, END
from app.chatbot.agents.safety import SafetyGuardAgent
from app.chatbot.agents.intent import IntentClassifierAgent
from app.chatbot.agents.retriever import QdrantRetrieverAgent
from app.chatbot.agents.reasoning import ReasoningAgent
from app.chatbot.agents.translator import TranslatorAgent
from app.chatbot.agents.advice import AdviceAgent
from app.chatbot.agents.summarizer import SummarizerAgent
from app.chatbot.agents.faithfulness import FaithfulnessCheckerAgent
from app.chatbot.agents.general_health import GeneralHealthAgent
from app.chatbot.memory.conversation import ConversationMemory
from app.chatbot.memory.long_term import LongTermMemory

conv_memory = ConversationMemory()
long_memory = LongTermMemory()

def build_chatbot_graph():
    workflow = StateGraph(dict)

    # Agents
    safety = SafetyGuardAgent()
    intent = IntentClassifierAgent()
    retriever = QdrantRetrieverAgent()
    reasoning = ReasoningAgent()
    translator = TranslatorAgent()
    advice = AdviceAgent()
    summarizer = SummarizerAgent()
    faithfulness = FaithfulnessCheckerAgent()
    general_health = GeneralHealthAgent()

    # Nodes
    workflow.add_node("safety", safety.run)
    workflow.add_node("intent", intent.run)
    workflow.add_node("retriever", retriever.run)
    workflow.add_node("reasoning", reasoning.run)
    workflow.add_node("translator", translator.run)
    workflow.add_node("advice", advice.run)
    workflow.add_node("summarizer", summarizer.run)
    workflow.add_node("faithfulness", faithfulness.run)
    workflow.add_node("general_health", general_health.run)

    # Flow
    workflow.set_entry_point("safety")
    workflow.add_edge("safety", "intent")

    workflow.add_conditional_edges(
        "intent",
        lambda state: state["intent"],  # IntentClassifierAgent sets this
        {
            "report_question": "retriever",
            "general_health": "general_health"
        }
    )

    # Report flow
    workflow.add_edge("retriever", "reasoning")
    workflow.add_edge("reasoning", "translator")
    workflow.add_edge("translator", "advice")
    workflow.add_edge("advice", "summarizer")
    workflow.add_edge("summarizer", "faithfulness")

    # General health flow
    workflow.add_edge("general_health", "advice")
    workflow.add_edge("advice", END)

    # End of report path
    workflow.add_edge("faithfulness", END)

    return workflow.compile()


def inject_memory(state: dict) -> dict:
    """Inject short- and long-term memory into the pipeline state."""
    user_id, case_id = state.get("user_id"), state.get("case_id")

    # Short-term memory (last 3 turns)
    short_turns = conv_memory.load(user_id, case_id, limit=3)
    state["history"] = [
        f"User: {h['query']}\nAssistant: {h['answer']}" for h in reversed(short_turns)
    ]

    # Long-term memory summaries
    long_turns = long_memory.search(state["query"], user_id, case_id)
    state["long_memory"] = long_turns

    return state
