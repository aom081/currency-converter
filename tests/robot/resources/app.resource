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

*** Keywords ***
Start Test Environment
    [Documentation]    เปิดเซิร์ฟเวอร์ (ครั้งเดียวทั้งชุด) และเบราว์เซอร์
    ${url}=    Start Servers
    Set Suite Variable    ${APP_URL}    ${url}
    New Browser    chromium    headless=${HEADLESS}

Stop Test Environment
    Close Browser

Open App
    [Documentation]    เปิดหน้าเว็บใน context ใหม่ (localStorage ว่างเสมอ)
    New Context    viewport={'width': 1280, 'height': 800}
    New Page    ${APP_URL}

Open App And Wait For Live
    Open App
    Wait For Live Status

Wait For Live Status
    Get Text    ${STATUS}    *=    ● สด

Wait For Offline Status
    Get Text    ${STATUS}    *=    ออฟไลน์

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
