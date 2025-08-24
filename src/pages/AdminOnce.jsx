import { useParams } from "react-router-dom";

export default function AdminOnce() {
  const { id } = useParams();
  return (
    <div style={{ padding: "20px" }}>
      <h2>Establecer 11 oficial – Partido #{id}</h2>
      <p>Aquí o administrador poderá seleccionar o 11 oficial.</p>
    </div>
  );
}
