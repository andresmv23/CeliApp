import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScanSuccess, onClose }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0 
            },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            }, 
            (error) => {
                // Silenciado intencionalmente para no saturar la consola con intentos de enfoque
            }
        );

        return () => {
            scanner.clear().catch(error => console.error("Error limpiando el escáner:", error));
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-5 rounded-xl w-full max-w-md relative shadow-2xl">
                <h3 className="text-center text-lg font-bold text-gray-800 mb-4">
                    Escanea el código de barras
                </h3>
                
                <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
                
                <button 
                    onClick={onClose} 
                    className="mt-4 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default Scanner;