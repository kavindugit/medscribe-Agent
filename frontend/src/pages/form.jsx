import axios from "axios";
import { useContext, useState } from "react";
import { AppContent } from "../context/AppContent";

export default function Uploader() {
  const { backendUrl, userData } = useContext(AppContent);
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");

  const onUpload = async () => {
    if (!file) return alert("Pick a PDF or image");
    if (!userData?.id) return alert("Not logged in");

    const form = new FormData();
    form.append("file", file);

    const { data } = await axios.post(
      `${backendUrl}/api/cases`,            
      form,
      {
        withCredentials: true,              // send auth cookies to Express
        headers: {
          "X-User-Id": userData.id,         // dev: pass user id to FastAPI via Express
        },
      }
    );
    setCaseId(data.case_id);
  };

  return (
    <div>
      <input type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0])}/>
      <button onClick={onUpload}>Upload</button>
      {caseId && <div>Uploaded. case_id: {caseId}</div>}
    </div>
  );
}
