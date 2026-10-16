*** Settings ***
Documentation     คีย์เวิร์ดและ selector กลางสำหรับทดสอบเครื่องคำนวณค่าเงิน
Library           Browser
Library           ../libs/AppServers.py

*** Variables ***
${HEADLESS}       ${TRUE}
${APP_URL}        http://127.0.0.1:5174/
${AMOUNT}         id=amt
${FROM}           id=from
${TO}             id=to
${BASE}           id=base
${SWAP}           id=swap
${REFRESH}        id=refresh
${RESULT}         id=result
${RATELINE}       id=rateline
${STATUS}         id=status
${SEARCH}         id=q
${ALL_ITEMS}      css=#all .item
${CARD}           css=#watch .w
${CARD_RATE}      css=#watch .w .rate
${DELTA_LAST}     css=#watch .w .chg span:nth-child(1)
${DELTA_SINCE}    css=#watch .w .chg span:nth-child(2)
${WATCH_EMPTY}    css=#watch .empty
${TOASTS}         css=#toasts .toast
${ALERT_STATE}    css=#watch .al-state
${CHART_TITLE}    id=chart-title
${CHART_MSG}      id=chart-msg
${CHART_SVG}      css=#chart-svg svg.chart
${MULTI_ROWS}     css=#multi .mrow
${MULTI_HEAD}     id=multi-head

*** Keywords ***
Start Test Environment
    [Documentation]    เปิดเซิร์ฟเวอร์ (ครั้งเดียวทั้งชุด) และเบราว์เซอร์
    ${url}=    Start Servers
    Set Suite Variable    ${APP_URL}    ${url}
    New Browser    chromium    headless=${HEADLESS}

Stop Test Environment
    Close Browser

Open App
    [Documentation]    เปิดหน้าเว็บใน context ใหม่ (localStorage ว่างเสมอ) ธีมของระบบกำหนดด้วย ${scheme} (light/dark)
    [Arguments]    ${scheme}=light
    New Context    viewport={'width': 1280, 'height': 800}    colorScheme=${scheme}
    New Page    ${APP_URL}

Open App And Wait For Live
    [Arguments]    ${scheme}=light
    Open App    ${scheme}
    Wait For Live Status

Wait For Live Status
    Get Text    ${STATUS}    matches    .*● (สด|Live).*

Wait For Offline Status
    Get Text    ${STATUS}    matches    .*(ออฟไลน์|Offline).*

Result Should Be
    [Arguments]    ${expected}
    Get Text    ${RESULT}    ==    ${expected}

Star From List
    [Arguments]    ${code}
    Click    css=#all [data-star="${code}"]

Unstar From Card
    [Arguments]    ${code}
    Click    css=#watch [data-star="${code}"]

Click Refresh
    Click    ${REFRESH}

Close Test Context
    Close Context

Mock Hits Should Exceed
    [Arguments]    ${n}
    ${hits}=    Get Mock Hits
    Should Be True    ${hits} > ${n}

Refresh And Wait
    [Documentation]    กดรีเฟรชและรอจนแอปเรียก API ครบรอบ (ปุ่มกลับมาใช้ได้)
    ${before}=    Get Mock Hits
    Click    ${REFRESH}
    Wait Until Keyword Succeeds    10s    200ms    Mock Hits Should Exceed    ${before}
    Get Property    ${REFRESH}    disabled    ==    ${False}

Choose Theme
    [Arguments]    ${mode}
    Click    css=[data-theme-set="${mode}"]

Body Background Should Be
    [Arguments]    ${rgb}
    Get Style    css=body    background-color    ==    ${rgb}

Theme Attribute Should Be
    [Arguments]    ${expected}
    Get Attribute    css=html    data-theme    ==    ${expected}

Set Alert
    [Arguments]    ${code}    ${dir}    ${target}
    Select Options By    css=[data-al-dir="${code}"]    value    ${dir}
    Fill Text    css=[data-al-target="${code}"]    ${target}
    Click    css=[data-al-set="${code}"]

Select Range
    [Arguments]    ${days}
    Click    css=#chart-range [data-range="${days}"]

Open App With Query
    [Documentation]    เปิดหน้าเว็บพร้อม query เช่น ?amt=250&from=EUR&to=JPY แล้วรอข้อมูลสด
    [Arguments]    ${query}
    New Context    viewport={'width': 1280, 'height': 800}    colorScheme=light
    New Page    ${APP_URL}${query}
    Wait For Live Status

Choose Lang
    [Arguments]    ${lang}
    Click    css=[data-lang-set="${lang}"]

Star Jpy Eur Gbp
    Star From List    JPY
    Star From List    EUR
    Star From List    GBP

Card Codes Should Be
    [Arguments]    @{expected}
    FOR    ${index}    ${code}    IN ENUMERATE    @{expected}
        Get Text    css=#watch .w .code >> nth=${index}    ==    ${code}
    END

Choose Sort
    [Arguments]    ${mode}
    Select Options By    id=watch-sort    value    ${mode}
