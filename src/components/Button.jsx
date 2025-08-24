export default function Button({ onClick, children }) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: "10px 20px",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}
