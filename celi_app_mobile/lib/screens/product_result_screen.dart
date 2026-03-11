import 'package:flutter/material.dart';
import '../services/api_services.dart';

class ProductResultScreen extends StatefulWidget {
  final String ean;

  const ProductResultScreen({super.key, required this.ean});

  @override
  State<ProductResultScreen> createState() => _ProductResultScreenState();
}

class _ProductResultScreenState extends State<ProductResultScreen> {
  late Future<Map<String, dynamic>> _productoFuture;

  @override
  void initState() {
    super.initState();
    _productoFuture = ApiService.buscarProducto(widget.ean);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resultado del Análisis'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _productoFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text("Analizando ingredientes..."),
                ],
              ),
            );
          }

          if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          }

          final data = snapshot.data!;
          
          if (data.containsKey('mensaje') && data['mensaje'] == "Producto imposible de identificar") {
             return _buildProductNotFoundState(data);
          }

          final producto = data['producto'];
          final analisis = data['analisis'];
          
          final bool esApto = analisis['es_apto'] == true;
          final Color colorEstado = esApto ? Colors.green : Colors.red;
          final IconData iconoEstado = esApto ? Icons.check_circle : Icons.cancel;
          final String textoEstado = esApto ? "APTO PARA CELÍACOS" : "NO APTO / CONTIENE GLUTEN";

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: colorEstado.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: colorEstado, width: 3),
                    ),
                    child: Column(
                      children: [
                        Icon(iconoEstado, size: 80, color: colorEstado),
                        const SizedBox(height: 16),
                        Text(
                          textoEstado,
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: colorEstado),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  Text(
                    producto['nombre'] ?? 'Sin nombre',
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    producto['marca'] ?? 'Marca desconocida',
                    style: const TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text("Motivo del análisis:", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      analisis['motivo'] ?? 'Sin detalles',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductNotFoundState(Map<String, dynamic> data) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.warning_amber_rounded, size: 80, color: Colors.orange),
            const SizedBox(height: 16),
            Text(
              data['mensaje'] ?? 'Producto no encontrado', 
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              data['consejo'] ?? '', 
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}