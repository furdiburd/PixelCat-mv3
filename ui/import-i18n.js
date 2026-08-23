(function () {
      var I18N = {
        en: {
          importTitle: 'Import backup', importDesc: 'Restore your saved companion, coins, shop items, quests, and settings.',
          importSelect: 'Select backup file', importNoFile: 'No file selected', importBackup: 'Import backup'
        },
        fr: {
          importTitle: 'Importer une sauvegarde', importDesc: 'Restaurer votre compagnon, vos pièces, objets du magasin, missions et réglages.',
          importSelect: 'Sélectionner un fichier de sauvegarde', importNoFile: 'Aucun fichier sélectionné', importBackup: 'Importer la sauvegarde'
        },
        it: {
          importTitle: 'Importa un backup', importDesc: 'Ripristina compagno, monete, oggetti, missioni e impostazioni.',
          importSelect: 'Seleziona file di backup', importNoFile: 'Nessun file selezionato', importBackup: 'Importa backup'
        },
        ar: {
          importTitle: 'استيراد نسخة احتياطية', importDesc: 'استعادة رفيقك والعملات وأغراض المتجر والمهام والإعدادات.',
          importSelect: 'اختر ملف النسخة الاحتياطية', importNoFile: 'لم يتم اختيار أي ملف', importBackup: 'استيراد النسخة الاحتياطية'
        }
      };
      function applyImportI18n() {
        if (!document.querySelectorAll('[data-i18n]').length) return;
        var api = (typeof API !== 'undefined') ? API : null;
        if (!api || !api.storage || !api.storage.local) return;
        var get = (typeof api.storage.local.get.length <= 1)
          ? api.storage.local.get.bind(api.storage.local)
          : function (k) { return new Promise(function (r) { api.storage.local.get(k, r); }); };
        get({ uiLanguage: 'en' }).then(function (data) {
          var lang = data.uiLanguage || 'en';
          var dict = I18N[lang] || I18N.en;
          document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
          document.documentElement.setAttribute('lang', lang);
          document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
          });
        }).catch(function () {});
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyImportI18n);
      else applyImportI18n();
    })();