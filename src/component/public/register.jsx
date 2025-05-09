// g:\controldoc-master99\src\component\public\RegisterCompanyPage.jsx
import React, { useState } from 'react';
import { auth, db } from '../../firebaseconfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    cuit: '',
    companyName: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Validaciones paralelas
      const [cuitSnap, emailSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("companyId", "==", formData.cuit))),
        getDocs(query(collection(db, "users"), where("email", "==", formData.email)))
      ]);

      if (!cuitSnap.empty) {
        throw new Error('El CUIT ya está registrado');
      }
      
      if (!emailSnap.empty) {
        throw new Error('El email ya está registrado');
      }

      // 2. Crear usuario
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 3. Crear documentos
      await Promise.all([
        setDoc(doc(db, "users", userCredential.user.uid), {
          email: formData.email,
          role: "user",
          companyId: formData.cuit,
          companyName: formData.companyName,
          firebaseUid: userCredential.user.uid,
          status: "pending",
          createdAt: serverTimestamp()
        }),
        setDoc(doc(db, "companies", formData.cuit), {
          cuit: formData.cuit,
          companyName: formData.companyName,
          ownerId: userCredential.user.uid,
          status: "pending",
          createdAt: serverTimestamp()
        })
      ]);

      // 4. Feedback
      alert('Registro exitoso\nSu empresa está pendiente de aprobación');
      navigate('/login');

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Registro de Empresa</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>CUIT:</label>
          <input
            type="text"
            value={formData.cuit}
            onChange={(e) => setFormData({...formData, cuit: e.target.value})}
            required
            pattern="[0-9]{11}"
            title="11 dígitos sin guiones"
          />
        </div>

        <div className="form-group">
          <label>Nombre de la Empresa:</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength="6"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Empresa'}
        </button>
      </form>
    </div>
  );
};

export default Register;