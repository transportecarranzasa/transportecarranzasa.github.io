document.addEventListener('DOMContentLoaded', function() {
    // =============================
    // 🚚 TRANSPORTE CARRANZA CHATBOT
    // =============================

    // --- ELEMENTOS DEL DOM ---
    const chatbotToggle = document.getElementById("chatbot-toggle");
    const chatbotWindow = document.getElementById("chatbot");
    const closeChatbot = document.getElementById("close-chatbot");
    const sendMessageBtn = document.getElementById("send-message");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");

    // --- ESTADO DEL CHATBOT ---
    let cotizacionStep = 0;
    let calculadoraStep = 0;
    let cotizacionData = {};
    let calculadoraData = {};

    const provincias = [
      "Bocas del Toro", "Coclé", "Colón", "Chiriquí", "Darién", 
      "Herrera", "Los Santos", "Panamá", "Panamá Oeste", "Veraguas"
    ];

    // --- PRECIOS DE REFERENCIA ---
    const preciosBase = {
      "Carga seca": 150,
      "Carga refrigerada": 250,
      "Cisterna": 200,
      "Carga en mesas": 180,
      "Mesa Botellera": 190,
    };
    const factorDistancia = { // Simulación simple de distancia
      "Panamá-Chiriquí": 1.8, "Panamá-Colón": 0.5, "Panamá-Coclé": 0.8,
      "Chiriquí-Panamá": 1.8, "Colón-Panamá": 0.5, "Coclé-Panamá": 0.8,
      "Panamá-Veraguas": 1.2, "Veraguas-Panamá": 1.2,
      // Añadir más combinaciones si es necesario
    };
    const precioPorKg = 0.25;
    const recargoUrgente = 1.5;

    // --- EVENT LISTENERS ---
    chatbotToggle.addEventListener("click", () => {
        if (chatbotWindow.style.display === 'flex') {
            chatbotWindow.style.display = 'none';
        } else {
            chatMessages.innerHTML = ''; // Limpiar chat
            resetConversation(); // Reiniciar estado
            chatbotWindow.style.display = 'flex';
            iniciarConversacion(); // Iniciar nueva conversación
        }
    });

    closeChatbot.addEventListener("click", () => {
        chatbotWindow.style.display = 'none';
        resetConversation();
    });

    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    sendMessageBtn.addEventListener("click", sendMessage);

    // --- LÓGICA CENTRAL DE CONVERSACIÓN ---

    function iniciarConversacion() {
        addBotMessage("👋 ¡Hola! Soy tu asistente virtual. ¿Cómo puedo ayudarte?");
        setTimeout(() => {
            addQuickReplies(["💰 Cotizar un envío", "⚖️ Calcular Peso Volumétrico"]);
        }, 1000);
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === "") return;
        addUserMessage(message);
        userInput.value = "";
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            if (cotizacionStep > 0) {
                handleCotizacionFlow(message);
            } else if (calculadoraStep > 0) {
                handleCalculadoraFlow(message);
            } else {
                // Simple NLU for initial interaction
                if (message.toLowerCase().includes('cotizar')) {
                    handleBotOption('cotizacion');
                } else if (message.toLowerCase().includes('calcular')) {
                    handleBotOption('calculadora');
                } else {
                    addBotMessage("No te he entendido. Por favor, elige una de las opciones.");
                    addQuickReplies(["💰 Cotizar un envío", "⚖️ Calcular Peso Volumétrico"]);
                }
            }
        }, 1200);
    }
    
    function handleQuickReplyClick(replyText) {
        addUserMessage(replyText);
        showTypingIndicator();
        setTimeout(() => {
            hideTypingIndicator();
            if (cotizacionStep > 0) {
                handleCotizacionFlow(replyText);
            } else if (calculadoraStep > 0) {
                handleCalculadoraFlow(replyText);
            } else {
                if (replyText.includes('Cotizar')) {
                    handleBotOption('cotizacion');
                } else if (replyText.includes('Calcular')) {
                    handleBotOption('calculadora');
                }
            }
        }, 1200);
    }

    function handleBotOption(option) {
        resetConversation();
        if (option === 'cotizacion') {
            cotizacionStep = 1;
            addBotMessage("¡Claro! Empecemos. ¿Qué tipo de carga es?");
            addQuickReplies(Object.keys(preciosBase));
        } else if (option === 'calculadora') {
            calculadoraStep = 1;
            addBotMessage("Vamos a calcular el peso. Dime el <b>largo</b> del paquete en metros.");
        }
    }

    // --- FLUJOS DE CONVERSACIÓN ---

    function handleCotizacionFlow(message) {
        switch (cotizacionStep) {
            case 1: // Carga
                cotizacionData.carga = message;
                cotizacionStep = 2;
                addBotMessage("Entendido. ¿Desde qué provincia sale?");
                addQuickReplies(provincias);
                break;
            case 2: // Origen
                cotizacionData.origen = message;
                cotizacionStep = 3;
                addBotMessage("Perfecto. ¿Y a qué provincia se dirige?");
                addQuickReplies(provincias);
                break;
            case 3: // Destino
                cotizacionData.destino = message;
                cotizacionStep = 4;
                addBotMessage("⚖️ ¿Cuál es el peso en kilogramos?");
                break;
            case 4: // Peso
                cotizacionData.peso = parseFloat(message);
                if (isNaN(cotizacionData.peso) || cotizacionData.peso <= 0) {
                    addBotMessage("Por favor, introduce un peso válido.");
                    return;
                }
                cotizacionStep = 5;
                addBotMessage("⏱️ ¿Qué tan urgente es?");
                addQuickReplies(["Normal (3-5 días)", "Urgente (24-48h)"]);
                break;
            case 5: // Urgencia y Final
                cotizacionData.urgencia = message;
                generarCotizacionFinal(cotizacionData);
                resetConversation();
                setTimeout(() => {
                    addBotMessage("¿Necesitas algo más?");
                    addQuickReplies(["💰 Cotizar otro envío", "⚖️ Calcular Peso"]);
                }, 2000);
                break;
        }
    }

    function handleCalculadoraFlow(message) {
        const valor = parseFloat(message);
        if (isNaN(valor) || valor <= 0) {
            addBotMessage("Por favor, introduce un número válido.");
            return;
        }
        switch (calculadoraStep) {
            case 1: // Largo
                calculadoraData.largo = valor;
                calculadoraStep = 2;
                addBotMessage("Ahora el <b>ancho</b> en metros.");
                break;
            case 2: // Ancho
                calculadoraData.ancho = valor;
                calculadoraStep = 3;
                addBotMessage("Y el <b>alto</b> en metros.");
                break;
            case 3: // Alto
                calculadoraData.alto = valor;
                calculadoraStep = 4;
                addBotMessage("Finalmente, ¿cuántos bultos son?");
                break;
            case 4: // Cantidad y resultado
                calculadoraData.cantidad = parseInt(message);
                const pesoVolumetrico = ((calculadoraData.largo * calculadoraData.ancho * calculadoraData.alto) * calculadoraData.cantidad) * 250;
                addBotMessage(`El peso volumétrico es de <b>${pesoVolumetrico.toFixed(2)} kg</b>.`);
                setTimeout(() => {
                    addBotMessage("¿Qué deseas hacer?");
                    addQuickReplies([`Usar ${pesoVolumetrico.toFixed(2)} kg para cotizar`, "Volver al inicio"]);
                }, 1000);
                calculadoraStep = 5;
                break;
            case 5: // Post-cálculo
                if (message.toLowerCase().includes('usar')) {
                    const peso = message.match(/(\d+\.\d+)/)[0];
                    handleBotOption('cotizacion');
                    setTimeout(() => {
                        cotizacionStep = 4;
                        handleCotizacionFlow(peso);
                    }, 500);
                } else {
                    resetConversation();
                    iniciarConversacion();
                }
                break;
        }
    }

    function generarCotizacionFinal(data) {
        let costo = preciosBase[data.carga] || 200;
        const ruta = `${data.origen}-${data.destino}`;
        costo *= factorDistancia[ruta] || 1.5;
        costo += data.peso * precioPorKg;
        if (data.urgencia.includes("Urgente")) costo *= recargoUrgente;
        
        const resumenHTML = `
            <div class="cotizacion-resumen">
              <h4>📝 Resumen de Cotización</h4>
              <div class="resumen-linea"><span><strong>Ruta:</strong></span><span>${data.origen} → ${data.destino}</span></div>
              <div class="resumen-linea"><span><strong>Carga:</strong></span><span>${data.carga}</span></div>
              <div class="resumen-linea"><span><strong>Peso:</strong></span><span>${data.peso} kg</span></div>
              <div class="resumen-linea"><span><strong>Urgencia:</strong></span><span>${data.urgencia}</span></div>
              <hr>
              <div class="resumen-total">
                <strong>Costo Estimado:</strong>
                <span class="precio-final">$${costo.toFixed(2)}</span>
              </div>
            </div>`;
        addBotMessage(resumenHTML);
    }

    // --- FUNCIONES AUXILIARES ---
    function addUserMessage(message) {
        const div = document.createElement("div");
        div.className = "chat-message user-message";
        div.innerHTML = `<div class="sender">Tú</div>${message}`;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const div = document.createElement("div");
        div.className = "chat-message bot-message";
        if (message.startsWith("<div")) {
            div.innerHTML = message;
        } else {
            div.innerHTML = `<div class="sender">Asistente</div>${message}`;
        }
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function addQuickReplies(replies) {
        const container = document.createElement("div");
        container.className = "quick-replies";
        replies.forEach(replyText => {
            const btn = document.createElement("button");
            btn.textContent = replyText;
            btn.addEventListener("click", () => {
                container.remove();
                handleQuickReplyClick(replyText);
            });
            container.appendChild(btn);
        });
        chatMessages.appendChild(container);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot-message typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
    
    function resetConversation() {
        cotizacionStep = 0;
        calculadoraStep = 0;
        cotizacionData = {};
        calculadoraData = {};
    }
    
    // (Re-añadir las implementaciones de funciones auxiliares que fueron omitidas por brevedad)
    // ...
});


// --- CALCULADORA DE VOLUMEN/PESO DEL FORMULARIO ---
window.calcularVolumenPeso = function() {
    const largo = parseFloat(document.getElementById("largo").value);
    const ancho = parseFloat(document.getElementById("ancho").value);
    const alto = parseFloat(document.getElementById("alto").value);
    const cantidad = parseInt(document.getElementById("cantidad").value);

    if (isNaN(largo) || isNaN(ancho) || isNaN(alto) || isNaN(cantidad)) {
        alert("Por favor, completa todos los campos de la calculadora.");
        return;
    }

    const volumenTotal = (largo * ancho * alto) * cantidad;
    const pesoVolumetrico = volumenTotal * 250; // Factor de conversión

    document.getElementById("resultado-volumen").textContent = volumenTotal.toFixed(2);
    document.getElementById("resultado-peso-volumetrico").textContent = pesoVolumetrico.toFixed(2);
    document.getElementById("calculadora-resultado").style.display = "block";
}

// --- COTIZACIÓN DESDE FORMULARIO ---
window.calcularCotizacionFormulario = function() {
    const data = {
        carga: document.getElementById('tipo-carga').value,
        origen: document.getElementById('origen').value,
        destino: document.getElementById('destino').value,
        peso: parseFloat(document.getElementById('peso').value),
        urgencia: document.getElementById('urgencia').value,
        contacto: document.getElementById('contacto').value,
    };

    if (!data.carga || !data.origen || !data.destino || isNaN(data.peso) || !data.urgencia || !data.contacto) {
        alert('Por favor, completa todos los campos para cotizar.');
        return;
    }

    // Reutilizar la función de generar cotización
    let costo = preciosBase[data.carga] || 200;
    const ruta = `${data.origen}-${data.destino}`;
    costo *= factorDistancia[ruta] || 1.5;
    costo += data.peso * precioPorKg;
    if (data.urgencia.includes("Urgente")) costo *= recargoUrgente;
    
    const resumenHTML = `
        <div class="cotizacion-resumen form-result">
          <h4>📝 Resumen de Cotización</h4>
          <div class="resumen-linea"><span><strong>Ruta:</strong></span><span>${data.origen} → ${data.destino}</span></div>
          <div class="resumen-linea"><span><strong>Carga:</strong></span><span>${data.carga}</span></div>
          <div class="resumen-linea"><span><strong>Peso:</strong></span><span>${data.peso} kg</span></div>
          <div class="resumen-linea"><span><strong>Urgencia:</strong></span><span>${data.urgencia}</span></div>
          <hr>
          <div class="resumen-total">
            <strong>Costo Estimado:</strong>
            <span class="precio-final">$${costo.toFixed(2)}</span>
          </div>
          <small>Este es un precio estimado. Contáctanos al ${data.contacto} para finalizar.</small>
        </div>`;
    
    document.getElementById('resultado-formulario-cotizacion').innerHTML = resumenHTML;
}
