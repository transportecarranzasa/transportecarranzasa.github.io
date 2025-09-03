import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Fuel, DollarSign, AlertCircle, CheckCircle, Package, Thermometer, Droplets } from 'lucide-react';

// --- Tipos de Datos ---
interface TransportData {
  status: 'En Ruta' | 'Detenido' | 'Alerta' | 'Entregado';
  location: string;
  eta: number; // en minutos
  fuelLevel: number; // en porcentaje
  totalCost: number;
  cargo: string;
  temperature: number; // en Celsius
  humidity: number; // en porcentaje
  alerts: string[];
}

// --- Componente de Tarjeta de Métrica ---
const MetricCard = ({ icon, title, value, unit = '', color = '#FFFFFF' }) => (
  <div style={styles.metricCard}>
    <div style={{ color }}>{icon}</div>
    <div>
      <p style={styles.metricTitle}>{title}</p>
      <p style={styles.metricValue}>{value} <span style={styles.metricUnit}>{unit}</span></p>
    </div>
  </div>
);

// --- Componente Principal del Panel de Control ---
const TransportAISystem: React.FC = () => {
  const [data, setData] = useState<TransportData>({
    status: 'En Ruta',
    location: 'Corredor Sur, Panamá',
    eta: 45,
    fuelLevel: 75,
    totalCost: 150.75,
    cargo: 'Electrónicos',
    temperature: 5.2,
    humidity: 88,
    alerts: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newFuel = prevData.fuelLevel > 1 ? prevData.fuelLevel - 0.5 : 0;
        const newEta = prevData.eta > 1 ? prevData.eta - 1 : 0;
        let newStatus = prevData.status;
        const newAlerts = [...prevData.alerts];

        if (newFuel < 20 && !newAlerts.includes('Nivel de combustible bajo')) {
          newAlerts.push('Nivel de combustible bajo');
          newStatus = 'Alerta';
        }
        
        if (newEta === 0 && prevData.status !== 'Entregado') {
            newStatus = 'Entregado';
        }

        return {
          ...prevData,
          fuelLevel: parseFloat(newFuel.toFixed(2)),
          eta: newEta,
          status: newStatus,
          alerts: newAlerts,
        };
      });
    }, 2000); // Actualiza cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (data.status) {
      case 'Entregado':
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'Alerta':
        return <AlertCircle size={24} color="#FFC107" />;
      default:
        return <Truck size={24} color="#2196F3" />;
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <h1 style={styles.header}>Panel de Monitoreo de Transporte IA</h1>
      
      <div style={styles.mainGrid}>
        {/* Columna Principal de Estado */}
        <div style={{...styles.statusCard, ...getStatusColor(data.status)}}>
          <div style={styles.statusHeader}>
            {getStatusIcon()}
            <h2 style={styles.statusTitle}>Estado Actual: {data.status}</h2>
          </div>
          <p style={styles.statusLocation}>Vehículo ID: TR-5491</p>
        </div>

        {/* Grid de Métricas */}
        <div style={styles.metricsGrid}>
          <MetricCard icon={<MapPin size={32} />} title="Ubicación" value={data.location} color="#81D4FA" />
          <MetricCard icon={<Clock size={32} />} title="ETA" value={data.eta} unit="min" color="#A5D6A7" />
          <MetricCard icon={<Fuel size={32} />} title="Combustible" value={data.fuelLevel} unit="%" color="#FFAB91" />
          <MetricCard icon={<DollarSign size={32} />} title="Costo Acumulado" value={`$${data.totalCost.toFixed(2)}`} color="#CE93D8" />
          <MetricCard icon={<Package size={32} />} title="Carga" value={data.cargo} color="#FFF59D" />
          <MetricCard icon={<Thermometer size={32} />} title="Temperatura" value={data.temperature} unit="°C" color="#90CAF9" />
          <MetricCard icon={<Droplets size={32} />} title="Humedad" value={data.humidity} unit="%" color="#B3E5FC" />
        </div>

        {/* Sección de Alertas */}
        {data.alerts.length > 0 && (
          <div style={styles.alertsContainer}>
            <h3 style={styles.alertsTitle}><AlertCircle size={20} /> Alertas Activas</h3>
            <ul style={styles.alertsList}>
              {data.alerts.map((alert, index) => (
                <li key={index} style={styles.alertItem}>{alert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Estilos (CSS-in-JS) ---
const getStatusColor = (status: TransportData['status']) => {
    switch (status) {
      case 'Entregado':
        return { borderLeft: '5px solid #4CAF50' };
      case 'Alerta':
        return { borderLeft: '5px solid #FFC107' };
      default:
        return { borderLeft: '5px solid #2196F3' };
    }
}

const styles: { [key: string]: React.CSSProperties } = {
  dashboardContainer: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    padding: '2rem',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '2.5rem',
    color: '#E0E0E0',
    fontWeight: 300,
  },
  mainGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  statusCard: {
    backgroundColor: '#2C2C2C',
    padding: '1.5rem',
    borderRadius: '8px',
    transition: 'border-left 0.3s ease',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  statusTitle: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 500,
  },
  statusLocation: {
    margin: 0,
    color: '#BDBDBD',
    fontSize: '1rem',
    paddingLeft: '3rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
  },
  metricCard: {
    backgroundColor: '#2C2C2C',
    padding: '1.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  metricTitle: {
    margin: '0 0 0.25rem 0',
    color: '#BDBDBD',
    fontSize: '0.9rem',
  },
  metricValue: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: '1rem',
    color: '#BDBDBD',
    fontWeight: 'normal',
  },
  alertsContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    border: '1px solid #FFC107',
    padding: '1.5rem',
    borderRadius: '8px',
  },
  alertsTitle: {
    margin: '0 0 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#FFC107',
  },
  alertsList: {
    margin: 0,
    paddingLeft: '20px',
  },
  alertItem: {
    marginBottom: '0.5rem',
  }
};

export default TransportAISystem;
