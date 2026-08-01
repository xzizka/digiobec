import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:obec_portal_mobile/core/network/dio_client.dart';

void main() {
  group('DioClient', () {
    test('can be instantiated with default base URL', () {
      final client = DioClient(baseUrl: 'http://test.example.com');
      expect(client.dio.options.baseUrl, equals('http://test.example.com'));
      expect(client.dio.options.connectTimeout, equals(const Duration(seconds: 10)));
      expect(client.dio.options.receiveTimeout, equals(const Duration(seconds: 30)));
    });

    test('can be instantiated with --dart-define API_BASE_URL fallback', () {
      final client = DioClient();
      expect(client.dio.options.baseUrl, equals('http://10.0.2.2:8080'));
    });

    test('baseUrl setter updates dio options', () {
      final client = DioClient(baseUrl: 'http://initial.example.com');
      client.baseUrl = 'http://updated.example.com';
      expect(client.dio.options.baseUrl, equals('http://updated.example.com'));
    });

    test('has interceptors configured', () {
      final client = DioClient(baseUrl: 'http://test.example.com');
      expect(client.dio.interceptors.length, greaterThanOrEqualTo(3));
    });

    test('default headers are set correctly', () {
      final client = DioClient(baseUrl: 'http://test.example.com');
      expect(client.dio.options.headers['Content-Type'], equals('application/json'));
      expect(client.dio.options.headers['Accept'], equals('application/json'));
    });
  });
}