import 'package:flutter_riverpod/flutter_riverpod.dart';

// Asegúrate de que las rutas a estos archivos sean correctas en tu proyecto
import '../services/api_services.dart';
import '../models/user_profile_model.dart';

// Este es el FutureProvider. Llama a getPerfilCompleto una vez y guarda el resultado.
final profileProvider = FutureProvider<UserProfileResponse>((ref) async {
  return await ApiService.getPerfilCompleto();
});
