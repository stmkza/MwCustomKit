//////////////////////////////////////////////
// MW Custom Kitの設定
// すでにJavaScriptが設定されている場合は，ファイルの最後に以下のコードを追加してください
//////////////////////////////////////////////
(() => {
    /*====================================
     * 設定項目
     ====================================*/
    const config = {
        // 使用する機能（trueで有効，falseで無効になります）
        features: {
            // メールを処理済みにした後，メール一覧画面に戻るようにする
            BackToMailListWhenFinish: true,

            // 「メール作成」ボタンからメール作成時に，宛先を反映したメールテンプレートを使えるようにする
            UpdateNewMailTemplateWhenDestinationNotSet: true,

            // 「一括設定する」画面を利用して，メールアプリケーション間の移動を一括で行えるようにする
            MailMoveBulk: true,
        },
    };

    /*====================================
     * これ以下は編集しないでください
     ====================================*/
    config.mainScriptUrl = config.mainScriptUrl || 'https://stmkza.github.io/MwCustomKit/customize.js';
    const script = document.createElement('script');
    script.src = config.mainScriptUrl;
    script.textContent = JSON.stringify(config);
    document.head.appendChild(script);
})();