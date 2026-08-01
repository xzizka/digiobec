import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../../features/address/presentation/address_selector_page.dart';
import '../../features/guest_submission/presentation/pages/home_page.dart';
import '../../features/submission/presentation/confirmation_page.dart';
import '../../features/submission/presentation/submission_form_page.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/form/:formId',
      name: 'form',
      builder: (context, state) {
        final formId = state.pathParameters['formId']!;
        return SubmissionFormPage(formKey: formId);
      },
    ),
    GoRoute(
      path: '/address',
      name: 'address',
      builder: (context, state) => const AddressSelectorPage(),
    ),
    GoRoute(
      path: '/confirmation/:referenceNumber',
      name: 'confirmation',
      builder: (context, state) {
        final referenceNumber = state.pathParameters['referenceNumber']!;
        return ConfirmationPage(trackingCode: referenceNumber);
      },
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    appBar: AppBar(title: const Text('Chyba')),
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text('Stránka nenalezena: ${state.error}'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.go('/'),
            child: const Text('Zpět na úvod'),
          ),
        ],
      ),
    ),
  ),
);