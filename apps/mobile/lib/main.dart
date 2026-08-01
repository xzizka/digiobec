import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'core/constants/app_constants.dart';
import 'core/router/app_router.dart';
import 'theme/broumy_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('cs', 'CZ'), Locale('en', 'US')],
      path: 'assets/translations',
      fallbackLocale: const Locale('cs', 'CZ'),
      saveLocale: true,
      child: const MunicipalPortalApp(),
    ),
  );
}

class MunicipalPortalApp extends StatelessWidget {
  const MunicipalPortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: BroumyTheme.light,
      darkTheme: BroumyTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: appRouter,
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
    );
  }
}