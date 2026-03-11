import 'package:flutter/material.dart';

const Color primaryGreen = Color(0xFF4CAF50);

// Tema Simple que SIEMPRE FUNCIONA
final ThemeData celiAppTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(seedColor: primaryGreen),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  ),
);