import 'package:celi_app_mobile/screens/product_result_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/profile_provider.dart';
import '../services/api_services.dart';
import '../screens/scanner_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Escuchamos el estado del perfil para renderizar condicionalmente el contenido (UI/Auth)
    final profileAsyncValue = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Inicio',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 28, letterSpacing: -0.5, color: Colors.black),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          profileAsyncValue.maybeWhen(
            data: (perfil) => TextButton.icon(
              icon: const Icon(Icons.logout, color: Colors.redAccent),
              label: const Text("Salir", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
              onPressed: () async {
                await ApiService.logoutUser();
                ref.invalidate(profileProvider);
              },
            ),
            orElse: () => TextButton.icon(
              icon: const Icon(Icons.person, color: Color(0xFF4CAF50)),
              label: const Text("Entrar", style: TextStyle(color: Color(0xFF4CAF50), fontWeight: FontWeight.bold)),
              onPressed: () {
                context.push('/login').then((_) {
                  ref.invalidate(profileProvider);
                });
              },
            ),
          )
        ],
      ),
      
      body: Center(
        // Limitamos el ancho para mantener la UX/UI pensada para móvil al ejecutar en web/desktop
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F3F1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: Color(0xFF2E7D32)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            "Escanea un producto para saber si es apto al instante.",
                            style: TextStyle(color: Colors.green[900], fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text("PRODUCTO A EXAMINAR", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
                  const SizedBox(height: 4),
                  const Text("Escanea con la cámara", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.black)),
                  const SizedBox(height: 16),
                  
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ScannerScreen()),
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      height: 160,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF4CAF50), Color(0xFF2E7D32)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF4CAF50).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))
                        ],
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.qr_code_scanner, size: 60, color: Colors.white),
                          SizedBox(height: 12),
                          Text("Pulsar para Escanear", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  profileAsyncValue.when(
                    skipLoadingOnReload: true, 
                    loading: () => const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator(color: Color(0xFF4CAF50)))),
                    error: (error, stackTrace) => const Center(child: Text("Error al cargar datos")),
                    data: (perfil) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Text("Tus Favoritos", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black)),
                              const SizedBox(width: 8),
                              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text("Productos guardados manualmente", style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                          const SizedBox(height: 16),
                          
                          SizedBox(
                            height: 250,
                            child: perfil.favoritos.isEmpty
                                ? const Center(child: Text("Aún no tienes favoritos", style: TextStyle(color: Colors.grey)))
                                : ListView.builder(
                                    physics: const BouncingScrollPhysics(),
                                    scrollDirection: Axis.horizontal,
                                    itemCount: perfil.favoritos.length,
                                    itemBuilder: (context, index) {
                                      final fav = perfil.favoritos[index];
                                      return _buildProductBigCard(
                                        context: context,
                                        ean: fav.ean,
                                        nombre: fav.nombre,
                                        marca: fav.marca,
                                        estadoGluten: fav.estadoGluten,
                                      );
                                    },
                                  ),
                          ),
                          const SizedBox(height: 32),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Text("Historial", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black)),
                              const SizedBox(width: 8),
                              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text("Últimos escaneos realizados", style: TextStyle(color: Colors.grey[600], fontSize: 14)),
                          const SizedBox(height: 16),
                          
                          SizedBox(
                            height: 250,
                            child: perfil.historial.isEmpty
                                ? const Center(child: Text("Aún no has escaneado nada", style: TextStyle(color: Colors.grey)))
                                : ListView.builder(
                                    physics: const BouncingScrollPhysics(),
                                    scrollDirection: Axis.horizontal,
                                    itemCount: perfil.historial.length,
                                    itemBuilder: (context, index) {
                                      final hist = perfil.historial[index];
                                      return _buildProductBigCard(
                                        context: context,
                                        ean: hist.ean,
                                        nombre: hist.nombre,
                                        marca: hist.marca,
                                        estadoGluten: hist.estadoGluten,
                                      );
                                    },
                                  ),
                          ),
                          const SizedBox(height: 40),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF2E7D32),
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 12),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.grid_view_rounded), label: 'Categorías'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Buscar'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'Listas'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Cuenta'),
        ],
      ),
    );
  }

  Widget _buildProductBigCard({
    required BuildContext context,
    required String ean,
    required String nombre,
    required String marca,
    required String estadoGluten,
  }) {
    final bool esApto = estadoGluten == 'APTO';
    // Mapeo del estado del producto a colores corporativos para feedback visual inmediato
    final Color estadoColor =
        esApto ? const Color(0xFF4CAF50) : (estadoGluten == 'DUDOSO' ? const Color(0xFFF57C00) : const Color(0xFFD32F2F));

    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => ProductResultScreen(ean: ean)));
      },
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 12, bottom: 8), 
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 4))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
              ),
              child: Stack(
                children: [
                  Center(child: Icon(Icons.image_outlined, color: Colors.grey[300], size: 50)),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Icon(
                      esApto ? Icons.check_circle : (estadoGluten == 'DUDOSO' ? Icons.help : Icons.cancel),
                      color: estadoColor,
                      size: 20,
                    ),
                  )
                ],
              ),
            ),
            
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nombre,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, height: 1.1, color: Colors.black),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      marca,
                      style: TextStyle(color: Colors.grey[500], fontSize: 13, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    
                    // TODO: Reemplazar el precio hardcodeado cuando el backend exponga los datos de scraping
                    Row(
                      children: [
                        const Text("€ 2,95", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.black)),
                        Text(" /ud", style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      ],
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
