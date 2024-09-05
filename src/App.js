import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import { db } from "./firebaseConfig"; // Arquivo de configuração do Firebase
import Modal from "react-modal";
import './App.css'; // Importa o arquivo de estilo

// Estilo do modal
const modalStyles = {
  overlay: {
    backgroundColor: '#000000aa',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    padding: '20px',
    backgroundColor: '#333',
    color: '#fff',
  },
};

// Página de redirecionamento
const RedirectPage = () => {
  const { id } = useParams(); // Pega o ID da URL

  useEffect(() => {
    const redirectUser = async () => {
      const linkDoc = doc(db, "links", id);
      const docSnap = await getDoc(linkDoc);
      if (docSnap.exists()) {
        // Incrementa a contagem de acessos
        const currentAccessCount = docSnap.data().accessCount || 0;
        await updateDoc(linkDoc, { accessCount: currentAccessCount + 1 });

        window.location.href = docSnap.data().url; // Redireciona para a URL armazenada
      } else {
        console.error("Link não encontrado");
      }
    };

    redirectUser();
  }, [id]);

  return <p>Redirecionando...</p>;
};

// Página principal para gerar e editar QR codes
const Home = () => {
  const [url, setUrl] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [redirectLink, setRedirectLink] = useState("");
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLink, setSelectedLink] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "links"), (querySnapshot) => {
      const linksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLinks(linksData);
      // Filtra os links com base no termo de busca
      setFilteredLinks(linksData.filter(link => link.id.includes(searchTerm)));
    });

    return () => unsubscribe(); // Limpa a assinatura do snapshot quando o componente desmonta
  }, [searchTerm]);

  // Função para criar um novo link de redirecionamento no Firebase
  const handleCreateRedirect = async () => {
    try {
      const docRef = await addDoc(collection(db, "links"), {
        url,
        accessCount: 0, // Inicializa o contador de acessos
      });
      const redirectUrl = `http://localhost:3000/redirect/${docRef.id}`;
      setRedirectLink(redirectUrl);
      setGeneratedUrl(redirectUrl);
      setUrl(""); // Limpa o campo de URL após criar
      closeCreateModal(); // Fecha o modal de criação após criar
    } catch (error) {
      console.error("Erro ao criar link de redirecionamento:", error);
    }
  };

  // Função para abrir o modal de criação
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Função para fechar o modal de criação
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Função para abrir o modal de edição
  const openEditModal = (link) => {
    setSelectedLink(link);
    setUrl(link.url);
    setGeneratedUrl(`http://localhost:3000/redirect/${link.id}`);
    setIsModalOpen(true);
  };

  // Função para fechar o modal de edição
  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedLink(null);
  };

  // Função para editar um link de redirecionamento no Firebase
  const handleEditRedirect = async () => {
    if (selectedLink) {
      try {
        const linkDoc = doc(db, "links", selectedLink.id);
        await updateDoc(linkDoc, { url });
        const updatedRedirectUrl = `http://localhost:3000/redirect/${selectedLink.id}`;
        setRedirectLink(updatedRedirectUrl);
        setGeneratedUrl(updatedRedirectUrl);
        setUrl(""); // Limpa o campo de URL após editar
        closeEditModal(); // Fecha o modal após editar
      } catch (error) {
        console.error("Erro ao editar link de redirecionamento:", error);
      }
    }
  };

  // Função para excluir um link de redirecionamento no Firebase
  const handleDeleteRedirect = async (id) => {
    try {
      await deleteDoc(doc(db, "links", id));
    } catch (error) {
      console.error("Erro ao excluir link de redirecionamento:", error);
    }
  };

  // Função para baixar o QR code como imagem
  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = "qrcode.png";
      link.click();
    }
  };

  return (
    <div className="container">
      <h1>Gerador de QR Code</h1>
      <button onClick={openCreateModal}>Criar Novo Link</button>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar pelo código de identificação"
      />
      <ul className="links-list">
        {filteredLinks.map((link) => (
          <li key={link.id} className="link-item">
            <div className="code-container">
              <span className="code-label">Código:</span>
              <span className="code-value">{link.id}</span>
            </div>
            <a
              className="qrcode-link"
              href={`http://localhost:3000/redirect/${link.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Acessar QR Code
            </a>
            <div className="link">{link.url}</div>
            <div className="access-count">
              <span>Acessos: {link.accessCount || 0}</span>
            </div>
            <button onClick={() => openEditModal(link)}>Editar</button>
            <button className="delete" onClick={() => handleDeleteRedirect(link.id)}>Excluir</button>
          </li>
        ))}
      </ul>

      {/* Modal de Criação */}
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={closeCreateModal}
        style={modalStyles}
      >
        <h2>Criar Novo Link de Redirecionamento</h2>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Digite o URL para o QR code"
        />
        <button onClick={handleCreateRedirect}>Criar QR Code</button>
        <button onClick={closeCreateModal}>Fechar</button>
      </Modal>

      {/* Modal de Edição */}
      {selectedLink && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeEditModal}
          style={modalStyles}
        >
          <h2>Editar Link de Redirecionamento</h2>
          <div className="modal-content">
            <QRCodeCanvas value={generatedUrl} />
            <p>Código de Identificação: {selectedLink.id}</p>
            <button onClick={downloadQRCode}>Baixar QR Code</button>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Digite o novo URL"
            />
            <button onClick={handleEditRedirect}>Salvar Alterações</button>
            <button onClick={closeEditModal}>Fechar</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Componente principal
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/redirect/:id" element={<RedirectPage />} />
      </Routes>
    </Router>
  );
};

export default App;
