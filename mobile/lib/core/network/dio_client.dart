import "dart:async";

import "package:dio/dio.dart";
import "package:flutter/foundation.dart";

class DioClient {
  DioClient({String? baseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl ?? const String.fromEnvironment(
            "API_BASE_URL",
            defaultValue: "http://10.0.2.2:8080",
          ),
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
          headers: {"Content-Type": "application/json"},
        ),
      ) {
    _setupInterceptors();
  }

  final Dio _dio;

  Dio get dio => _dio;

  void _setupInterceptors() {
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: kDebugMode,
        responseBody: kDebugMode,
        logPrint: (obj) => debugPrint(obj.toString()),
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) async {
          if (_shouldRetry(error)) {
            final retryCount = error.requestOptions.extra["retryCount"] as int? ?? 0;
            if (retryCount < 3) {
              final delay = Duration(milliseconds: 500 * (1 << retryCount));
              await Future.delayed(delay);
              error.requestOptions.extra["retryCount"] = retryCount + 1;
              try {
                final response = await _dio.fetch(error.requestOptions);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          return handler.next(error);
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (kDebugMode) {
            debugPrint("REQUEST[${options.method}] => PATH: ${options.path}");
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint(
              "RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}",
            );
          }
          return handler.next(response);
        },
      ),
    );
  }

  bool _shouldRetry(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.connectionError ||
        (error.response?.statusCode != null &&
         error.response!.statusCode! >= 500);
  }
}