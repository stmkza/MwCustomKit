window.addEventListener('load', (function (features) {
    const config = JSON.parse(document.currentScript.textContent);
    const keyState = {
        shift: false,
    };
    const utils = {
        hook: (targetFunctionName, beforeCallback = () => { }, afterCallback = () => { }) => {
            const originalFunction = window[targetFunctionName];
            window[targetFunctionName] = function () {
                if (beforeCallback) {
                    beforeCallback.apply(this, arguments);
                }
                const result = originalFunction.apply(this, arguments);
                if (afterCallback) {
                    afterCallback.apply(this, arguments);
                }
                return result;
            };
        },
        hookHandler: (targetFunctionName, beforeCallback = () => true, afterCallback = () => true) => {
            const originalFunction = window[targetFunctionName];
            window[targetFunctionName] = function () {
                if (beforeCallback) {
                    const beforeCallbackResult = beforeCallback.apply(this, arguments);
                    if (!beforeCallbackResult) {
                        return beforeCallbackResult;
                    }
                }
                const result = originalFunction.apply(this, arguments);
                if (!result) {
                    return result;
                }
                if (afterCallback) {
                    const afterCallbackResult = afterCallback.apply(this, arguments);
                    if (!afterCallbackResult) {
                        return afterCallbackResult;
                    }
                }
                return result;
            };
        },
        getBackLinkUrl: () => {
            const url = document.querySelector('.backlink > a').href;
            return url ?? '/m/mw.cgi';
        },
        createElement: (tagName, attributes, children) => {
            const element = document.createElement(tagName);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'classList') {
                    value.forEach(className => {
                        element.classList.add(className);
                    });
                    return;
                }
                if (key === 'required') {
                    if (value) {
                        element.required = true;
                    }
                    return;
                }
                if (key === 'checked') {
                    if (value) {
                        element.checked = true;
                    }
                    return;
                }
                if (key === 'style') {
                    Object.entries(value).forEach(([styleKey, styleValue]) => {
                        element.style[styleKey] = styleValue;
                    });
                    return;
                }
                element.setAttribute(key, value);
            });
            children.forEach(child => {
                element.appendChild(child);
            });
            return element;
        },
        isAdmin: () => {
            return document.querySelector('#system-submenu > a[href^="mw.cgi?page=SystemAdmin"]') !== null;
        },
        isShiftKey: (ev) => {
            return keyState.shift;
        }
    };
    window.addEventListener('keydown', (ev) => {
        keyState.shift = ev.shiftKey;
    });
    window.addEventListener('keyup', (ev) => {
        keyState.shift = ev.shiftKey;
    });

    let unsetFeatureFlags = [];
    Object.entries(features).forEach(([feature, handler]) => {
        if (!config.features.hasOwnProperty(feature)) {
            unsetFeatureFlags.push(feature);
        } else if (config.features[feature]) {
            handler(utils);
        }
    });
    if (unsetFeatureFlags.length > 0 && utils.isAdmin()) {
        console.warn(`%cMW Custom Kitに更新があります\n` +
            `\n` +
            `%cMW Custom Kitに以下の機能が追加されました。これらの機能を使用するには，メールワイズのシステム設定「JavaScriptファイルの設定」から，JavaScriptファイルを変更してください。\n` +
            `変更後の設定内容については，以下のURLを参照してください。\n` +
            `https://github.com/stmkza/mw_custom_kit\n` +
            `\n` +
            `%c追加された機能\n` +
            `%c` +
            unsetFeatureFlags.map(flagName => `・${flagName}`).join('\n'),
            'font-size: 1.5em; font-weight: bold; background-color: blue; color: white; padding: 0 0.5em; border-radius: 0.3em;',
            'font-size: 1.2em;',
            'font-size: 1.35em; font-weight: bold; background-color: #ee7800; color: white; padding: 0 0.5em; border-radius: 0.3em;',
            'font-size: 1.2em;');
    }
})({
    BackToMailListWhenFinish: utils => {
        const localStorageKey = 'BackToMailListWhenFinish_doBackToList';
        if (window.CustomizeJS.page !== 'MailView') {
            if (localStorage.getItem(localStorageKey)) {
                localStorage.removeItem(localStorageKey);
            }
            return;
        }
        utils.hookHandler('onFinish', () => {
            localStorage.setItem(localStorageKey, true);
            return true;
        });
        if (localStorage.getItem(localStorageKey)) {
            localStorage.removeItem(localStorageKey);
            window.location.href = utils.getBackLinkUrl();
        }
    },
    UpdateNewMailTemplateWhenDestinationNotSet: utils => {
        if (CustomizeJS.page !== 'MailSelectAddress') return;
        utils.hookHandler('onInsert', (form) => {
            if (!IsAliveWindow(window.parent.opener)) return true;
            const parentForm = window.parent.opener.document.MailSend;
            if (!(form.To.value !== '' && !form.To.value.includes(',') && form.CC.value === '' && form.BCC.value === '' && parentForm.To.value === '' && parentForm.CC.value === '' && parentForm.BCC.value === ''))
                return true;
            if (confirm("指定されたToアドレスを使用して新規メールを作成しますか？\n\n入力した本文はリセットされます。")) {
                window.parent.opener.location.replace(`mw.cgi?page=MailSend&wid=${form.WID.value}&bs=${form.BS.value}&did=&mid=&dbid=&type=&bpt=&cid=&text=${encodeURIComponent(form.To.value)}`);
                window.close();
                return false;
            }
            return true;
        });
    },
    MailMoveBulk: utils => {
        if (CustomizeJS.page !== 'MailPropertySetEach') return;
        const aEntryViewUrl = document.querySelector(`#col-subject-${document.querySelector('#mainColumn .dataList tr[id^="hl"]').id.substring(2)} a`).href;

        const tbody = document.querySelector('#mainColumn > .formTable > tbody');
        tbody.insertBefore(
            utils.createElement('tr', {}, [
                utils.createElement('th', {
                    nowrap: '',
                }, [
                    document.createTextNode('移動先アプリケーション'),
                ]),
                utils.createElement('td', {
                    nowrap: '',
                }, [
                    utils.createElement('select', {
                        name: 'BulkTidChange',
                    }, [
                        utils.createElement('option', {
                            value: '',
                        }, [
                            document.createTextNode('--'),
                        ]),
                    ]),
                ]),
            ]),
            tbody.querySelector('tr:nth-child(5)')
        )
        const updateTidList = (tidList) => {
            document.forms[1].BulkTidChange.innerHTML = '';

            const option = document.createElement('option');
            option.value = '';
            option.innerText = '--';
            document.forms[1].BulkTidChange.appendChild(option);

            tidList.forEach(([value, text]) => {
                const option = document.createElement('option');
                option.value = value;
                option.innerText = text;
                document.forms[1].BulkTidChange.appendChild(option);
            });
        };

        const pendingMoveMailUrls = [];
        let ifrState = 1;
        const ifr = document.createElement('iframe');
        ifr.style.display = 'none';
        ifr.src = aEntryViewUrl;
        ifr.addEventListener('load', () => {
            switch (ifrState) {
                case 1:
                    ifr.contentWindow.onMove();
                    break;
                case 2:
                    updateTidList([...ifr.contentDocument.forms[1].TID.options].map(option => [option.value, option.innerText]));
                    break;
            }
            if (ifrState > 2) {
                // ここからは実際の移動処理
                switch (ifrState % 3 + 1) {
                    case 1:
                        ifr.contentWindow.onMove();
                        break;
                    case 2:
                        ifr.contentDocument.forms[1].TID.value = document.forms[1].BulkTidChange.value;
                        ifr.contentDocument.forms[1].submit();
                        break;
                    case 3:
                        // 移動後ページ
                        const nextUrl = pendingMoveMailUrls.shift();
                        if (nextUrl) {
                            ifr.src = nextUrl;
                        } else {
                            alert('全てのメールを移動しました。');
                            document.forms[1].Cancel.click();
                        }
                        break;
                }
            }
            ifrState++;
        });
        document.body.appendChild(ifr);

        utils.hookHandler('onSubmit', (form) => {
            if (form.BulkTidChange.value === '') {
                return true;
            }

            if (!confirm("アプリケーションを移動する際は，他の一括設定操作は適用されません。\n\nアプリケーションを移動しますか？")) {
                return true;
            }

            const pendingView = utils.createElement('div', {
                style: {
                    position: 'fixed',
                    top: 0,
                    zIndex: 10000,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(255, 255, 255, 0.8)',
                    paddingTop: '40vh',
                }
            }, [
                utils.createElement('h1', {
                    style: {
                        textAlign: 'center',
                    }
                }, [
                    document.createTextNode('メールを移動中です。ページを閉じないでください……'),
                ]),
            ]);
            document.body.appendChild(pendingView);

            const mailIds = [...form.querySelectorAll('#mainColumn .dataList tr[id^="hl"]')].map(e => e.id.substring(2));

            mailIds.forEach(mailId => {
                pendingMoveMailUrls.push(document.querySelector(`#col-subject-${mailId} a`).href);
            });
            ifr.src = pendingMoveMailUrls.shift();

            return false;
        });
    },
    BulkCheckMailList: utils => {
        if (window.CustomizeJS.page !== 'MailIndex') {
            return;
        }
        const checkBoxes = [];
        let lastCheckedId = null;
        [...document.querySelectorAll('#contentColumn #mainColumn form[name=MailIndex] .dataList tr > td.cellCheck .inputCheckBox[name=MID]')]
            .map((check, i) => {
                checkBoxes.push(check);
                check.addEventListener('change', (ev) => {
                    if (lastCheckedId === null) {
                        lastCheckedId = i;
                        return;
                    }
                    if (!utils.isShiftKey()) {
                        return;
                    }
                    const operationType = checkBoxes[i].checked;
                    const start = Math.min(lastCheckedId, i);
                    const end = Math.max(lastCheckedId, i);
                    for (let j = start; j <= end; j++) {
                        checkBoxes[j].checked = operationType;
                    }
                    lastCheckedId = i;
                });
            });
    },
}));