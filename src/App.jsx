import { useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!image) return alert("Please select an image");

    setLoading(true);

    const fileName = `${Date.now()}-${image.name}`;

    const { data, error } = await supabase.storage
      .from("Images")
      .upload(fileName, image);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("Images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from("images")
      .insert([{ image_url: imageUrl }]);

    if (dbError) {
      alert(dbError.message);
    } else {
      alert("Image uploaded successfully!");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Upload Image to Supabase</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}

export default App;
