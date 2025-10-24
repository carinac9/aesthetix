import React, { useEffect, useState } from "react";
import "../styles/RoomCreation.css";

const FURNITURE_TYPES = ["chair", "sofa", "table", "lamp", "bed", "cabinet", "shelf", "desk", "stool", "bench"];
const STYLES = ["modern", "classic", "vintage", "scandinavian", "industrial", "minimal", "boho", "rustic"]; 

export default function FurnitureBrowser({ onSelectFurniture }) {
  // state for furniture data and filters
  const [furnitureItems, setFurnitureItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [style, setStyle] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // get furniture when filters or page changes
  useEffect(() => {
    async function fetchFurniture() {
      setLoading(true);
      setError(null);
      try {
        let q = query || "furniture";
        if (type) q += ` ${type}`;
        if (style) q += ` ${style}`;
        const res = await fetch(
          `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(q)}&downloadable=true&archives_flavours=gltf&page=${page}&per_page=24`,
          {
            headers: {
              Authorization: "Token d8528b15a0044b0dbe7f211b90fe94f2",
            },
          }
        );
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
          setError("No results from Sketchfab API. Try a different search or filter.");
          setFurnitureItems([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        // get out collections and rooms
        const filtered = data.results.filter(
          (item) =>
            !item.name.toLowerCase().includes("collection") &&
            !item.name.toLowerCase().includes("room") &&
            !item.tags.some((tag) => tag.name.toLowerCase().includes("collection") || tag.name.toLowerCase().includes("room"))
        );
        setFurnitureItems(filtered);
        setHasMore(!!data.next);
      } catch (e) {
        setError("Failed to load furniture items: " + e.message);
        setFurnitureItems([]);
      }
      setLoading(false);
    }
    fetchFurniture();
  }, [query, type, style, page]);

  // submit new search query
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(e.target.search.value);
  };

  // check for downloadable gltf for selected model
  const handleSelect = async (item) => {
  try {
    const res = await fetch(`https://api.sketchfab.com/v3/models/${item.uid}/download`, {
      headers: {
        Authorization: "Token d8528b15a0044b0dbe7f211b90fe94f2",
      },
    });
    const data = await res.json();
    let gltfUrl = null;
    if (data.gltf && data.gltf.url) gltfUrl = data.gltf.url;
    else if (data.gltf2 && data.gltf2.url) gltfUrl = data.gltf2.url;

    if (gltfUrl && gltfUrl.match(/\.(gltf|glb|zip)(\?|$)/i)) {
      let placementMode = "floor";
      const name = item.name.toLowerCase();
      if (name.includes("lamp") || name.includes("chandelier") || name.includes("ceiling")) {
        placementMode = "ceiling";
      } else if (name.includes("shelf") || name.includes("window") || name.includes("wall")) {
        placementMode = "wall";
      } else if (name.includes("tv") || name.includes("monitor")) {
        placementMode = "surface";
      }

      onSelectFurniture({ ...item, gltfUrl, placementMode });
    } else {
      alert("This model is not downloadable as glTF, GLB, or ZIP. Please choose another item.");
    }
  } catch (e) {
    alert("Could not fetch 3D model for this item. Please try again later.");
  }
};


  return (
    <div className="furniture-browser">
      {/* search + filter */}
      <form onSubmit={handleSearch} style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <input name="search" placeholder="Search..." style={{ flex: 1 }} />
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {FURNITURE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={style} onChange={e => { setStyle(e.target.value); setPage(1); }}>
          <option value="">All Styles</option>
          {STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </form>
      
      {loading && <div>Loading furniture...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {furnitureItems.map((item) => (
          <div
            key={item.uid}
            className="furniture-item"
            title={item.name}
            onClick={() => handleSelect(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              opacity: 1,
              pointerEvents: 'auto',
            }}
          >
            <img
              src={item.thumbnails?.images?.[0]?.url || item.thumbnails?.images?.[1]?.url}
              alt={item.name}
              style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, background: '#f8f8f8' }}
            />
            <div style={{ fontWeight: 500 }}>{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
