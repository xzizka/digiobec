import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../theme/broumy_tokens.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _healthStatus = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _healthStatus = 'loading'.tr();
    _checkBackendHealth();
  }

  Future<void> _checkBackendHealth() async {
    try {
      final dio = DioClient().dio;
      final response = await dio.get(AppConstants.healthEndpoint);
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          _healthStatus = 'healthStatus'.tr(args: [
            data['status'].toString(),
            data['database'].toString(),
            data['keycloak'].toString(),
          ]);
          _isLoading = false;
        });
      } else {
        setState(() {
          _healthStatus = 'errorHttp'.tr(args: [response.statusCode.toString()]);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _healthStatus = 'connectionError'.tr(args: [e.toString()]);
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('appName'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _checkBackendHealth,
            tooltip: 'refresh'.tr(),
          ),
          PopupMenuButton<Locale>(
            icon: const Icon(Icons.language),
            tooltip: 'language'.tr(),
            onSelected: (Locale locale) {
              context.setLocale(locale);
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem<Locale>(
                value: Locale('cs', 'CZ'),
                child: Row(
                  children: [
                    Text('🇨🇿 '),
                    Text('Česky'),
                  ],
                ),
              ),
              const PopupMenuItem<Locale>(
                value: Locale('en', 'US'),
                child: Row(
                  children: [
                    Text('🇬🇧 '),
                    Text('English'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero section
              Icon(
                Icons.account_balance_outlined,
                size: 80,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                'welcomeTitle'.tr(),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'welcomeSubtitle'.tr(),
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),

              // Health status
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Icon(
                        _healthStatus.contains('UP') || _healthStatus.contains('Operational')
                            ? Icons.check_circle
                            : Icons.error,
                        color: _healthStatus.contains('UP') || _healthStatus.contains('Operational')
                            ? BroumyColors.success
                            : BroumyColors.error,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _healthStatus,
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                      if (_isLoading)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Primary CTA
              ElevatedButton.icon(
                icon: const Icon(Icons.description_outlined, size: 24),
                label: Text('submitRequest'.tr()),
                onPressed: () => context.go('/form/info-request'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                ),
              ),
              const SizedBox(height: 16),

              // Secondary CTAs
              OutlinedButton.icon(
                icon: const Icon(Icons.payment_outlined, size: 24),
                label: Text('payFees'.tr()),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('paymentsPhase2'.tr())),
                  );
                },
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.message_outlined, size: 24),
                label: Text('communicateWithOffice'.tr()),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('communicationPhase3'.tr())),
                  );
                },
              ),
              const SizedBox(height: 32),

              // Info
              Text(
                '${'version'.tr()} ${AppConstants.appVersion}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}