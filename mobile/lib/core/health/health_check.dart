import 'package:flutter/material.dart';
import 'dart:convert';
import '../../core/network/dio_client.dart';

class HealthCheck extends StatefulWidget {
  const HealthCheck({super.key});

  @override
  State<HealthCheck> createState() => _HealthCheckState();
}

class _HealthCheckState extends State<HealthCheck> {
  final DioClient _dioClient = DioClient();
  Map<String, dynamic>? _healthData;
  bool _isLoading = true;
  String? _error;
  DateTime? _lastChecked;

  @override
  void initState() {
    super.initState();
    _fetchHealth();
  }

  Future<void> _fetchHealth() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _dioClient.dio.get('/actuator/health');
      setState(() {
        _healthData = response.data as Map<String, dynamic>;
        _isLoading = false;
        _lastChecked = DateTime.now();
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _lastChecked = DateTime.now();
      });
    }
  }

  Color _getStatusColor() {
    if (_healthData == null) return Colors.grey;
    final status = _healthData!['status'] as String?;
    switch (status) {
      case 'UP':
        return const Color(0xFF007B3D); // gov.cz success green
      case 'DOWN':
        return const Color(0xFFD62828); // gov.cz error red
      case 'OUT_OF_SERVICE':
        return const Color(0xFFF5A623); // gov.cz warning amber
      default:
        return Colors.grey;
    }
  }

  String _getStatusText() {
    if (_healthData == null) return 'Unknown';
    return (_healthData!['status'] as String?)?.toUpperCase() ?? 'UNKNOWN';
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Check'),
        backgroundColor: const Color(0xFF004B87), // gov.cz primary blue
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchHealth,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Semantics(
        label: 'Backend health status: $_getStatusText()',
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStatusCard(theme, statusColor),
              const SizedBox(height: 16),
              if (_healthData != null) _buildDetailsCard(theme),
              if (_error != null) _buildErrorCard(theme),
              const SizedBox(height: 16),
              _buildMetaInfo(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(ThemeData theme, Color statusColor) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(
              _getStatusIcon(),
              size: 64,
              color: statusColor,
              semanticLabel: 'Status: $_getStatusText()',
            ),
            const SizedBox(height: 16),
            Text(
              _getStatusText(),
              style: theme.textTheme.headlineMedium?.copyWith(
                color: statusColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _isLoading ? 'Checking backend health...' : 'Last checked: ${_formatTime(_lastChecked)}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  IconData _getStatusIcon() {
    if (_healthData == null) return Icons.help_outline;
    final status = _healthData!['status'] as String?;
    switch (status) {
      case 'UP':
        return Icons.check_circle;
      case 'DOWN':
        return Icons.error;
      case 'OUT_OF_SERVICE':
        return Icons.warning;
      default:
        return Icons.help_outline;
    }
  }

  Widget _buildDetailsCard(ThemeData theme) {
    final components = _healthData!['components'] as Map<String, dynamic>?;

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Components',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            if (components != null) ...[
              ...components.entries.map((entry) => _buildComponentRow(
                theme,
                entry.key,
                entry.value as Map<String, dynamic>,
              )),
            ] else ...[
              _buildJsonDisplay(theme),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildComponentRow(ThemeData theme, String name, Map<String, dynamic> component) {
    final status = component['status'] as String? ?? 'UNKNOWN';
    final details = component['details'] as Map<String, dynamic>?;

    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'UP':
        statusColor = const Color(0xFF007B3D);
        statusIcon = Icons.check_circle;
      case 'DOWN':
        statusColor = const Color(0xFFD62828);
        statusIcon = Icons.error;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help_outline;
    }

    return ExpansionTile(
      leading: Icon(statusIcon, color: statusColor),
      title: Text(
        name,
        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
      trailing: Text(
        status,
        style: theme.textTheme.labelLarge?.copyWith(
          color: statusColor,
          fontWeight: FontWeight.bold,
        ),
      ),
      children: [
        if (details != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: details.entries.map((e) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  '${e.key}: ${e.value}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontFamily: 'monospace',
                  ),
                ),
              )).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildJsonDisplay(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: SelectableText(
        const JsonEncoder.withIndent('  ').convert(_healthData),
        style: theme.textTheme.bodySmall?.copyWith(
          fontFamily: 'monospace',
        ),
      ),
    );
  }

  Widget _buildErrorCard(ThemeData theme) {
    return Card(
      elevation: 1,
      color: theme.colorScheme.errorContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.error_outline, color: theme.colorScheme.onErrorContainer),
                const SizedBox(width: 8),
                Text(
                  'Error',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SelectableText(
              _error!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onErrorContainer,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetaInfo(ThemeData theme) {
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Debug Info',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Base URL: ${_dioClient.dio.options.baseUrl}',
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
              ),
            ),
            Text(
              'Flutter: ${_getFlutterVersion()}',
              style: theme.textTheme.bodySmall?.copyWith(
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime? time) {
    if (time == null) return 'Never';
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}:${time.second.toString().padLeft(2, '0')}';
  }

  String _getFlutterVersion() {
    return '3.24+'; // Would use package_info_plus in real app
  }
}