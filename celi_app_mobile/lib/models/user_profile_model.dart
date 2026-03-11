class UserProfileResponse {
  final User usuario;
  final List<ProductSummary> historial;
  final List<ProductSummary> favoritos;

  // El constructor
  UserProfileResponse({
    required this.usuario,
    required this.historial,
    required this.favoritos,
  });

  // La "fábrica". Esta es la función mágica que coge el JSON sucio de internet
  // y construye nuestro objeto limpio en Dart.
  factory UserProfileResponse.fromJson(Map<String, dynamic> json) {
    return UserProfileResponse(
      // Si "usuario" no existe, pasamos un mapa vacío para que no explote
      usuario: User.fromJson(json['usuario'] ?? {}),
      
      // Mapeamos la lista de historial. Si es nula, devolvemos una lista vacía []
      historial: (json['historial'] as List<dynamic>?)
              ?.map((e) => ProductSummary.fromJson(e))
              .toList() ??
          [],
          
      // Hacemos lo mismo con los favoritos
      favoritos: (json['favoritos'] as List<dynamic>?)
              ?.map((e) => ProductSummary.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class User {
  final int id;
  final String email;
  final String fullName;

  User({required this.id, required this.email, required this.fullName});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      // Si el backend devuelve null en full_name, ponemos 'Usuario' por defecto
      fullName: json['full_name'] ?? 'Usuario',
    );
  }
}

class ProductSummary {
  final String? fecha; 
  final String nombre;
  final String marca;
  final String ean;
  final String estadoGluten;

  ProductSummary({
    this.fecha,
    required this.nombre,
    required this.marca,
    required this.ean,
    required this.estadoGluten,
  });

  factory ProductSummary.fromJson(Map<String, dynamic> json) {
    return ProductSummary(
      // Convertimos la fecha a String porque FastAPI la manda como ISO 8601
      fecha: json['fecha']?.toString(), 
      nombre: json['nombre'] ?? 'Desconocido',
      marca: json['marca'] ?? 'Desconocido',
      ean: json['ean'] ?? '',
      estadoGluten: json['estado_gluten'] ?? 'DUDOSO',
    );
  }
}