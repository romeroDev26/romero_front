
RemissionGuidesListPage.tsx:125 Uncaught TypeError: Cannot read properties of undefined (reading 'business_name')
    at Object.accessor (RemissionGuidesListPage.tsx:125:66)
    at DataTable.tsx:114:33
    at Array.map (<anonymous>)
    at DataTable.tsx:106:28
    at Array.map (<anonymous>)
    at DataTable (DataTable.tsx:100:19)
    at react-stack-bottom-frame (react-dom_client.js?v=71c172cc:17424:20)
    at renderWithHooks (react-dom_client.js?v=71c172cc:4206:24)
    at updateFunctionComponent (react-dom_client.js?v=71c172cc:6619:21)
    at beginWork (react-dom_client.js?v=71c172cc:7654:20)
accessor @ RemissionGuidesListPage.tsx:125
(anonymous) @ DataTable.tsx:114
(anonymous) @ DataTable.tsx:106
DataTable @ DataTable.tsx:100
react-stack-bottom-frame @ react-dom_client.js?v=71c172cc:17424
renderWithHooks @ react-dom_client.js?v=71c172cc:4206
updateFunctionComponent @ react-dom_client.js?v=71c172cc:6619
beginWork @ react-dom_client.js?v=71c172cc:7654
runWithFiberInDEV @ react-dom_client.js?v=71c172cc:1485
performUnitOfWork @ react-dom_client.js?v=71c172cc:10868
workLoopSync @ react-dom_client.js?v=71c172cc:10728
renderRootSync @ react-dom_client.js?v=71c172cc:10711
performWorkOnRoot @ react-dom_client.js?v=71c172cc:10359
performSyncWorkOnRoot @ react-dom_client.js?v=71c172cc:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=71c172cc:11536
processRootScheduleInMicrotask @ react-dom_client.js?v=71c172cc:11558
(anonymous) @ react-dom_client.js?v=71c172cc:11649
<DataTable>
exports.jsxDEV @ react_jsx-dev-runtime.js?v=71c172cc:250
RemissionGuidesListPage @ RemissionGuidesListPage.tsx:369
react-stack-bottom-frame @ react-dom_client.js?v=71c172cc:17424
renderWithHooksAgain @ react-dom_client.js?v=71c172cc:4281
renderWithHooks @ react-dom_client.js?v=71c172cc:4217
updateFunctionComponent @ react-dom_client.js?v=71c172cc:6619
beginWork @ react-dom_client.js?v=71c172cc:7613
runWithFiberInDEV @ react-dom_client.js?v=71c172cc:1485
performUnitOfWork @ react-dom_client.js?v=71c172cc:10868
workLoopConcurrentByScheduler @ react-dom_client.js?v=71c172cc:10864
renderRootConcurrent @ react-dom_client.js?v=71c172cc:10844
performWorkOnRoot @ react-dom_client.js?v=71c172cc:10330
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=71c172cc:11623
performWorkUntilDeadline @ react-dom_client.js?v=71c172cc:36
RemissionGuidesListPage.tsx:369 An error occurred in the <DataTable> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

esto obtengo del preview del backend:
[
    {
        "document_type_code": "31",
        "series": "T001",
        "issue_date": "2025-09-17",
        "shipment_start_date": "2025-09-17",
        "observation": "Generación automática de prueba",
        "total_gross_weight": 1.0,
        "weight_unit_code": "KGM",
        "number_of_packages": 1,
        "sender_doc_type": "6",
        "sender_doc_number": "20602423248",
        "sender_name": "GLOBAL ROMERO S.A.C.",
        "recipient_doc_type": "1",
        "recipient_doc_number": "76307497",
        "recipient_name": "WILMER ALEXANDER EDQUÉN BARBOZA",
        "origin_ubigeo": "160601",
        "origin_address": "NAUTA, LORETO, LORETO",
        "destination_ubigeo": "000000",
        "destination_address": "Embarcadero ARAHUANTE, Río Amazonas",
        "transport_mode_code": "02",
        "trip_id": 22,
        "vessel_id": 20,
        "driver_doc_type": "1",
        "driver_doc_number": "12345678",
        "driver_name": "Capitán de Prueba",
        "driver_license": "LIC123456",
        "id": 8,
        "company_id": 1,
        "number": 3,
        "sunat_status": "PENDING",
        "created_by": "353ed60d-4337-42c0-a51a-fb492c8a4dea",
        "created_at": "2025-09-17T20:46:18.773862Z",
        "updated_at": "2025-09-17T20:46:18.773862Z",
        "items": []
    },
    {
        "document_type_code": "31",
        "series": "T001",
        "issue_date": "2025-09-17",
        "shipment_start_date": "2025-09-17",
        "observation": "Generación automática de prueba",
        "total_gross_weight": 1.0,
        "weight_unit_code": "KGM",
        "number_of_packages": 1,
        "sender_doc_type": "6",
        "sender_doc_number": "20602423248",
        "sender_name": "GLOBAL ROMERO S.A.C.",
        "recipient_doc_type": "1",
        "recipient_doc_number": "76307497",
        "recipient_name": "WILMER ALEXANDER EDQUÉN BARBOZA",
        "origin_ubigeo": "160601",
        "origin_address": "NAUTA, LORETO, LORETO",
        "destination_ubigeo": "000000",
        "destination_address": "Embarcadero OLLANTA, Río Amazonas",
        "transport_mode_code": "02",
        "trip_id": 22,
        "vessel_id": 20,
        "driver_doc_type": "1",
        "driver_doc_number": "12345678",
        "driver_name": "Capitán de Prueba",
        "driver_license": "LIC123456",
        "id": 7,
        "company_id": 1,
        "number": 2,
        "sunat_status": "PENDING",
        "created_by": "353ed60d-4337-42c0-a51a-fb492c8a4dea",
        "created_at": "2025-09-17T20:46:17.242012Z",
        "updated_at": "2025-09-17T20:46:17.242012Z",
        "items": []
    }
]
