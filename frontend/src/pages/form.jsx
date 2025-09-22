import axios from "axios";
import { useContext, useState } from "react";
import { AppContent } from "../context/AppContext";

export default function Uploader() {
  const { backendUrl, userData } = useContext(AppContent);
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onUpload = async () => {
    if (!file) return alert("Pick a PDF or image");
    if (!userData?.id) return alert("Not logged in");

    setLoading(true);
    setError("");
    setCaseId("");

    try {
      const form = new FormData();
      form.append("file", file);

      const { data } = await axios.post(
        `${backendUrl}/api/cases`,
        form,
        {
          withCredentials: true, // send auth cookies to Express
          headers: {
            "X-User-Id": userData.user_id,
          },
        }
      );

      setCaseId(data.case_id);
    } catch (err) {
      console.error("Upload error:", err?.response?.data || err.message);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">Upload Medical Report</h3>
      <p className="text-sm text-neutral-400">
        Upload a PDF or image to start processing.
      </p>

      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0])}
          className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-md 
                     file:border-0 file:bg-gradient-to-r file:from-cyan-400 file:to-fuchsia-500 
                     file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:opacity-90"
        />

        <button
          onClick={onUpload}
          disabled={loading || !file}
          className={`w-full rounded-lg px-4 py-2 text-sm font-semibold 
            ${loading || !file
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black hover:opacity-90"
            }`}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {error && (
          <p className="text-sm text-red-400 font-medium">{error}</p>
        )}

        {caseId && (
          <div className="mt-3 text-sm text-green-400">
            ✅ Uploaded successfully <br />
            <span className="text-xs text-neutral-300">Case ID: {caseId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
