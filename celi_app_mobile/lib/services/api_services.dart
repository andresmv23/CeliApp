import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart'; 
import '../models/user_profile_model.dart';

class ApiService {
  // TODO: Cambiar a la URL de Render cuando el backend esté desplegado en producción
  // Para emulador Android local usa: 'http://10.0.2.2:8000'
  // Para iOS/Web local usa: 'http://127.0.0.1:8000'
  static const String baseUrl = 'http://127.0.0.1:8000'; 
  
  static const _storage = FlutterSecureStorage(); 
  static const String _tokenKey = 'jwt_token';

  static Future<bool> loginUser(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          'username': email, 
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final String token = data['access_token']; 
        
        await _storage.write(key: _tokenKey, value: token);
        return true;
      } 
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<UserProfileResponse> getPerfilCompleto() async {
    final token = await getToken();
    
    if (token == null) {
      throw Exception('UNAUTHORIZED: No token found');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/users/perfil'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> decodedData = jsonDecode(utf8.decode(response.bodyBytes));
      return UserProfileResponse.fromJson(decodedData);
    } else {
      if (response.statusCode == 401) {
        await logoutUser();
      }
      throw Exception('UNAUTHORIZED: Token invalid or expired');
    }
  }

  static Future<void> logoutUser() async {
    await _storage.delete(key: _tokenKey);
  }

  static Future<Map<String, dynamic>> buscarProducto(String ean) async {
    final token = await getToken();
    
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    final response = await http.get(
      Uri.parse('$baseUrl/producto/$ean'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Error searching product: ${response.statusCode}');
    }
  }
}