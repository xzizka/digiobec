import 'package:dio/dio.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/dio_client.dart';

class SubmissionRemoteDatasource {
  SubmissionRemoteDatasource({Dio? dio}) : _dio = dio ?? DioClient().dio;

  final Dio _dio;

  Future<List<Map<String, dynamic>>> fetchFormCatalog() async {
    final response =
        await _dio.get<List<dynamic>>(AppConstants.formsEndpoint);
    final data = response.data ?? const [];
    return data.map((e) => (e as Map).cast<String, dynamic>()).toList();
  }

  Future<Map<String, dynamic>> fetchFormSchema(String formKey) async {
    final response =
        await _dio.get<Map<String, dynamic>>('${AppConstants.formsEndpoint}/$formKey');
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> submit({
    required String formKey,
    required Map<String, dynamic> formData,
    String? contactEmail,
    String? contactPhone,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      AppConstants.submissionsEndpoint,
      data: {
        'formKey': formKey,
        'formData': formData,
        if (contactEmail != null) 'contactEmail': contactEmail,
        if (contactPhone != null) 'contactPhone': contactPhone,
      },
    );
    return response.data ?? const {};
  }
}
