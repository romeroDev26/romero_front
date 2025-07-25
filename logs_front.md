<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Representantes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
        }

        .title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
        }

        .progress-badge {
            background: #f1f5f9;
            color: #475569;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
        }

        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
            overflow: hidden;
        }

        .card-header {
            background: #f8fafc;
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
        }

        .card-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .card-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: #3b82f6;
            border-radius: 2px;
        }

        .card-content {
            padding: 24px;
        }

        .steps-list {
            list-style: none;
        }

        .step-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 16px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .step-item:last-child {
            border-bottom: none;
        }

        .step-number {
            background: #3b82f6;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            flex-shrink: 0;
        }

        .step-content {
            flex: 1;
        }

        .step-text {
            font-size: 15px;
            color: #475569;
            margin-top: 2px;
        }

        .features-list {
            display: flex;
            gap: 24px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f1f5f9;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
            font-size: 14px;
        }

        .feature-icon {
            width: 16px;
            height: 16px;
            background: #10b981;
            border-radius: 50%;
            position: relative;
        }

        .feature-icon::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
        }

        .quantity-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .quantity-label {
            font-size: 16px;
            font-weight: 500;
            color: #374151;
        }

        .quantity-control {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .quantity-btn {
            width: 36px;
            height: 36px;
            border: 2px solid #d1d5db;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            font-weight: 600;
            color: #6b7280;
            transition: all 0.2s;
        }

        .quantity-btn:hover {
            border-color: #3b82f6;
            color: #3b82f6;
            background: #f8fafc;
        }

        .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .quantity-input {
            width: 60px;
            height: 36px;
            text-align: center;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
        }

        .representatives-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
        }

        .count-badge {
            background: #e5e7eb;
            color: #6b7280;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-primary:hover {
            background: #2563eb;
        }

        .btn-secondary {
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }

        .empty-state {
            text-align: center;
            padding: 40px 24px;
            color: #9ca3af;
        }

        .empty-state-icon {
            width: 48px;
            height: 48px;
            background: #f3f4f6;
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .empty-state-text {
            font-size: 16px;
            margin-bottom: 20px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 16px;
            }
            
            .header {
                flex-direction: column;
                gap: 16px;
                align-items: flex-start;
            }
            
            .features-list {
                flex-direction: column;
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1 class="title">Gestión de Representantes</h1>
            <div class="progress-badge" id="progressBadge">0 / 1 agregados</div>
        </div>

        <!-- Sistema de Representantes -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Sistema de Representantes Empresariales</h2>
            </div>
            <div class="card-content">
                <ol class="steps-list">
                    <li class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <div class="step-text">Configure la cantidad total de pasajes que desea facturar para la empresa</div>
                        </div>
                    </li>
                    <li class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <div class="step-text">Haga clic en "Crear Factura Empresarial" para generar la factura principal</div>
                        </div>
                    </li>
                    <li class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <div class="step-text">Agregue los representantes/empleados que viajarán usando el botón "Agregar Representante"</div>
                        </div>
                    </li>
                    <li class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <div class="step-text">Cada representante aparecerá en el manifiesto con sus datos individuales</div>
                        </div>
                    </li>
                </ol>

                <div class="features-list">
                    <div class="feature-item">
                        <div class="feature-icon"></div>
                        <span>Una factura para todos</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon"></div>
                        <span>Múltiples pasajeros</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon"></div>
                        <span>Manifiesto detallado</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cantidad de Pasajes -->
        <div class="card">
            <div class="card-content">
                <div class="quantity-section">
                    <div>
                        <div class="quantity-label">Cantidad de Pasajes</div>
                        <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Número total de pasajes a facturar</div>
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="decreaseQuantity()" id="decreaseBtn">−</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="50" id="quantityInput" onchange="updateQuantity()">
                        <button class="quantity-btn" onclick="increaseQuantity()" id="increaseBtn">+</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Representantes -->
        <div class="card">
            <div class="card-content">
                <div class="representatives-section">
                    <div>
                        <span class="section-title">Representantes</span>
                        <span class="count-badge" id="representativeCount">0</span>
                    </div>
                    <button class="btn btn-primary" onclick="addRepresentative()">
                        + Agregar
                    </button>
                </div>

                <div class="empty-state" id="emptyState">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">No hay representantes agregados</div>
                    <button class="btn btn-secondary" onclick="addRepresentative()">
                        Agregar Primer Representante
                    </button>
                </div>

                <div id="representativesList" style="display: none;">
                    <!-- Los representantes agregados aparecerán aquí -->
                </div>
            </div>
        </div>
    </div>

    <script>
        let representatives = [];
        let quantity = 1;

        function updateUI() {
            const progressBadge = document.getElementById('progressBadge');
            const representativeCount = document.getElementById('representativeCount');
            const emptyState = document.getElementById('emptyState');
            const representativesList = document.getElementById('representativesList');

            progressBadge.textContent = `${representatives.length} / ${quantity} agregados`;
            representativeCount.textContent = representatives.length;

            if (representatives.length === 0) {
                emptyState.style.display = 'block';
                representativesList.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                representativesList.style.display = 'block';
                renderRepresentatives();
            }

            // Update decrease button state
            document.getElementById('decreaseBtn').disabled = quantity <= 1;
        }

        function increaseQuantity() {
            quantity++;
            document.getElementById('quantityInput').value = quantity;
            updateUI();
        }

        function decreaseQuantity() {
            if (quantity > 1) {
                quantity--;
                document.getElementById('quantityInput').value = quantity;
                updateUI();
            }
        }

        function updateQuantity() {
            const input = document.getElementById('quantityInput');
            quantity = Math.max(1, parseInt(input.value) || 1);
            input.value = quantity;
            updateUI();
        }

        function addRepresentative() {
            if (representatives.length < quantity) {
                const newRep = {
                    id: Date.now(),
                    name: `Representante ${representatives.length + 1}`,
                    email: '',
                    phone: ''
                };
                representatives.push(newRep);
                updateUI();
            } else {
                alert('Ya ha alcanzado el máximo de representantes permitidos para la cantidad de pasajes configurada.');
            }
        }

        function removeRepresentative(id) {
            representatives = representatives.filter(rep => rep.id !== id);
            updateUI();
        }

        function renderRepresentatives() {
            const container = document.getElementById('representativesList');
            container.innerHTML = representatives.map(rep => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fafafa;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 500; color: #374151;">${rep.name}</div>
                            <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Datos pendientes de completar</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;">Editar</button>
                            <button class="btn" style="padding: 8px 12px; background: #ef4444; color: white; font-size: 12px;" onclick="removeRepresentative(${rep.id})">×</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Initialize
        updateUI();
    </script>
</body>
</html>