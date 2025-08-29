import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langgraph.graph import StateGraph, END

# 🔑 Load env variables
from dotenv import load_dotenv
load_dotenv()

# Embeddings
embedding_model = HuggingFaceEmbeddings(model_name=os.getenv("HF_EMBED_MODEL"))

# Primary LLM (Gemini 1.5 Flash)
llm = ChatGoogleGenerativeAI(
    model=os.getenv("LLM_FALLBACK_MODEL", "gemini-1.5-flash"),
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.2
)

# ----------------------------
# Agent Placeholder Functions
# ----------------------------

def safety_guard(state):
    """Detect if query is emergency-related."""
    query = state["query"]
    # placeholder classification
    if "chest pain" in query.lower() or "can't breathe" in query.lower():
        return {"response": "🚨 This may be a medical emergency. Please seek urgent care immediately.", "end": True}
    return {"query": query}

def query_understanding(state):
    """Classify intent: report_question / general_health."""
    # ⚠️ Here we’ll later add LLMChain
    return {"intent": "report_question", "query": state["query"]}

def report_retriever(state):
    """Retrieve info from user’s FAISS index."""
    user_id = state.get("user_id")
    user_folder = f"../storage/users/{user_id}/"
    index_path = os.path.join(user_folder, "index.faiss")
    pkl_path = os.path.join(user_folder, "index.pkl")

    if os.path.exists(index_path):
        db = FAISS.load_local(user_folder, embedding_model, index_name="index")
        retriever = db.as_retriever(search_kwargs={"k": 3})
        docs = retriever.get_relevant_documents(state["query"])
        return {"docs": docs}
    return {"docs": []}

def kb_retriever(state):
    """Retrieve general medical knowledge (placeholder)."""
    return {"docs": [{"content": "Cholesterol is a substance in your blood. High levels may increase risk of heart disease."}]}

def reasoning_agent(state):
    """Summarize retrieved docs (placeholder)."""
    docs = state.get("docs", [])
    if not docs:
        return {"reasoning": "No relevant information found."}
    combined = " ".join([d.page_content if hasattr(d, "page_content") else d["content"] for d in docs])
    return {"reasoning": combined}

def translator_agent(state):
    """Simplify medical jargon."""
    text = state.get("reasoning", "")
    return {"simplified": f"Patient-friendly explanation: {text}"}

def advice_agent(state):
    """Add safe advice."""
    simplified = state.get("simplified", "")
    return {"response": f"{simplified}\n\n💡 Advice: Please follow a healthy lifestyle and consult your doctor if needed."}

# ----------------------------
# Build LangGraph Orchestrator
# ----------------------------

def build_chatbot_graph():
    workflow = StateGraph(dict)

    # Nodes
    workflow.add_node("safety_guard", safety_guard)
    workflow.add_node("query_understanding", query_understanding)
    workflow.add_node("report_retriever", report_retriever)
    workflow.add_node("kb_retriever", kb_retriever)
    workflow.add_node("reasoning_agent", reasoning_agent)
    workflow.add_node("translator_agent", translator_agent)
    workflow.add_node("advice_agent", advice_agent)

    # Edges
    workflow.set_entry_point("safety_guard")
    workflow.add_edge("safety_guard", "query_understanding")

    # Branch after query understanding
    workflow.add_conditional_edges(
        "query_understanding",
        lambda state: state["intent"],
        {
            "report_question": "report_retriever",
            "general_health": "kb_retriever"
        }
    )

    # Merge to reasoning
    workflow.add_edge("report_retriever", "reasoning_agent")
    workflow.add_edge("kb_retriever", "reasoning_agent")

    workflow.add_edge("reasoning_agent", "translator_agent")
    workflow.add_edge("translator_agent", "advice_agent")

    workflow.add_edge("advice_agent", END)

    return workflow.compile()
