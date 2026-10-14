/**
 * ============================================================================
 * DIGITALEDU — GOOGLE SHEETS DATABASE BACKEND (GOOGLE APPS SCRIPT)
 * ============================================================================
 * SPREADSHEET URL:
 * https://docs.google.com/spreadsheets/d/1aJGuP1Dkj_hJYb76d4zwimz20zUcjcOK0oUOY2SEqPM/edit
 *
 * SOZLASH:
 * 1. Jadvalda "Kengaytmalar" (Extensions) -> "Apps Script" ni bosing.
 * 2. Kodni to'liq joylashtiring va Saqlang (Ctrl + S).
 * 3. Yuqorida "initDatabase" funksiyasini tanlab "Ishga tushirish" (Run) bosing.
 *    Bu barcha varaqlarni va Admin hisobini avtomatik yaratadi.
 * 4. "Deploy" -> "New deployment" -> "Web app":
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Web App URL ni nusxalab oling.
 * ============================================================================
 */

var SPREADSHEET_ID = '1aJGuP1Dkj_hJYb76d4zwimz20zUcjcOK0oUOY2SEqPM';

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== '') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function createResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function handleRequest(e) {
  try {
    var params = {};
    if (e && e.parameter) {
      for (var k in e.parameter) {
        params[k] = e.parameter[k];
      }
    }
    if (e && e.postData && e.postData.contents) {
      try {
        var body = JSON.parse(e.postData.contents);
        for (var b in body) {
          params[b] = body[b];
        }
      } catch (err) {
        // Fallback for form post
      }
    }

    var action = params.action || 'ping';

    switch (action) {
      case 'ping':
        return createResponse({
          success: true,
          message: 'DigitalEdu Google Sheets API ishlamoqda',
          spreadsheetId: getSpreadsheet().getId(),
          timestamp: new Date().toISOString()
        });
      case 'init':
        return createResponse(initDatabase());
      case 'signIn':
        return createResponse(signInUser(params));
      case 'signUp':
        return createResponse(signUpUser(params));
      case 'getProfile':
        return createResponse(getProfile(params.userId));
      case 'updateProfile':
        return createResponse(updateProfile(params));
      case 'completeDiagnostic':
        return createResponse(completeDiagnostic(params));
      case 'saveQuizResult':
        return createResponse(saveQuizResult(params));
      case 'savePracticeResult':
        return createResponse(savePracticeResult(params));
      case 'getLeaderboard':
        return createResponse(getLeaderboard());
      case 'getContentItems':
        return createResponse(getContentItems(params.type, params.status));
      case 'getContentItem':
        return createResponse(getContentItem(params.id));
      case 'saveContentItem':
        return createResponse(saveContentItem(params));
      case 'deleteContentItem':
        return createResponse(deleteContentItem(params.id));
      case 'uploadSubmission':
        return createResponse(uploadSubmission(params));
      case 'getSubmissions':
        return createResponse(getSubmissions(params));
      case 'getMySubmissions':
        return createResponse(getMySubmissions(params.userId));
      case 'gradeSubmission':
        return createResponse(gradeSubmission(params));
      case 'downloadFile':
        return createResponse(downloadFile(params.submissionId));
      case 'submitRoleRequest':
        return createResponse(submitRoleRequest(params));
      case 'getRoleRequests':
        return createResponse(getRoleRequests());
      case 'getMyRoleRequest':
        return createResponse(getMyRoleRequest(params.userId));
      case 'reviewRoleRequest':
        return createResponse(reviewRoleRequest(params));
      case 'getUsers':
        return createResponse(getUsers());
      case 'setUserRole':
        return createResponse(setUserRole(params));
      case 'getTeacherData':
        return createResponse(getTeacherData());
      case 'seedRichDatabase':
        return createResponse(seedRichDatabase());
      default:
        return createResponse({ success: false, error: 'Noma\'lum amal: ' + action });
    }
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  
  if (headers && headers.length > 0) {
    var currentLastRow = sheet.getLastRow();
    var currentLastCol = sheet.getLastColumn();
    
    if (currentLastRow === 0 || currentLastCol === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0f172a');
      headerRange.setFontColor('#38bdf8');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var results = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = { _rowIndex: i + 1 };
    var hasData = false;
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      if (val !== '' && val !== null && val !== undefined) {
        hasData = true;
      }
      obj[key] = val;
    }
    if (hasData && obj.id) {
      results.push(obj);
    }
  }
  return results;
}

function initDatabase() {
  var ss = getSpreadsheet();

  var schemas = {
    profiles: [
      'id', 'email', 'password', 'username', 'full_name', 'avatar_emoji',
      'group_name', 'role', 'diagnostic_completed', 'diagnostic_score',
      'diagnostic_total', 'diagnostic_completed_at', 'created_at', 'updated_at'
    ],
    content_items: [
      'id', 'content_type', 'title', 'description', 'body', 'topic_id',
      'questions', 'practice', 'status', 'created_by', 'created_at', 'updated_at'
    ],
    quiz_results: [
      'id', 'user_id', 'topic_id', 'content_item_id', 'part_id', 'score',
      'total_questions', 'percentage', 'xp_earned', 'completed_at'
    ],
    practice_results: [
      'id', 'user_id', 'topic_id', 'content_item_id', 'score', 'max_score',
      'xp_earned', 'completed_at'
    ],
    diagnostic_results: [
      'id', 'user_id', 'score', 'total_questions', 'percentage', 'answers',
      'completed_at'
    ],
    submissions: [
      'id', 'user_id', 'content_item_id', 'file_name', 'file_size', 'file_data',
      'status', 'score', 'feedback', 'graded_by', 'graded_at', 'created_at', 'updated_at'
    ],
    role_requests: [
      'id', 'user_id', 'status', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
    ]
  };

  for (var sheetName in schemas) {
    getOrCreateSheet(ss, sheetName, schemas[sheetName]);
  }

  var profilesSheet = ss.getSheetByName('profiles');
  var profiles = sheetToObjects(profilesSheet);
  var adminFound = false;

  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i].email === 'admin@digitaledu.uz' || profiles[i].role === 'admin') {
      adminFound = true;
      break;
    }
  }

  if (!adminFound) {
    var now = new Date().toISOString();
    profilesSheet.appendRow([
      'admin-default-id',
      'admin@digitaledu.uz',
      'DigitalEdu2024!Admin',
      'admin',
      'Bosh Administrator',
      '👑',
      'DigitalEdu Boshqaruvi',
      'admin',
      true,
      15,
      15,
      now,
      now,
      now
    ]);

    profilesSheet.appendRow([
      'teacher-default-id',
      'teacher@digitaledu.uz',
      'Teacher2024!',
      'teacher_farhod',
      'Farhod Alimov',
      '👨‍🏫',
      'Pedagogika kafedrasi',
      'teacher',
      true,
      14,
      15,
      now,
      now,
      now
    ]);

    profilesSheet.appendRow([
      'student-default-id',
      'student@digitaledu.uz',
      'Student2024!',
      'student_malika',
      'Malika Karimova',
      '🎓',
      '201-guruh',
      'student',
      true,
      12,
      15,
      now,
      now,
      now
    ]);
  }

  var sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Лист1');
  if (sheet1 && sheet1.getLastRow() <= 1 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(sheet1);
    } catch (e) {}
  }

  return {
    success: true,
    message: 'Baza jadvallari muvaffaqiyatli sozlandi va Foydalanuvchilar yaratildi',
    sheets: Object.keys(schemas)
  };
}

function signUpUser(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(sheet);

  var email = (data.email || '').trim().toLowerCase();
  var password = data.password || '';
  var fullName = (data.fullName || data.full_name || '').trim();
  var groupName = (data.groupName || data.group_name || '').trim();
  var role = data.role || 'student';

  if (!email || !password) {
    return { success: false, error: 'Email va parol kiritilishi shart' };
  }

  for (var i = 0; i < profiles.length; i++) {
    if ((profiles[i].email || '').toLowerCase() === email) {
      return { success: false, error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan' };
    }
  }

  var id = 'usr_' + Utilities.getUuid();
  var username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_');
  var now = new Date().toISOString();

  sheet.appendRow([
    id,
    email,
    password,
    username,
    fullName || username,
    '🎯',
    groupName,
    role,
    false,
    0,
    0,
    '',
    now,
    now
  ]);

  var userProfile = {
    id: id,
    email: email,
    username: username,
    full_name: fullName || username,
    avatar_emoji: '🎯',
    group_name: groupName,
    role: role,
    diagnostic_completed: false,
    diagnostic_score: 0,
    diagnostic_total: 0,
    diagnostic_completed_at: null,
    created_at: now,
    updated_at: now
  };

  return {
    success: true,
    user: { id: id, email: email },
    profile: userProfile
  };
}

function signInUser(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(sheet);

  var email = (data.email || '').trim().toLowerCase();
  var password = data.password || '';

  if (!email || !password) {
    return { success: false, error: 'Email va parolni kiriting' };
  }

  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    if ((p.email || '').toLowerCase() === email || (p.username || '').toLowerCase() === email) {
      if (p.password === password) {
        var profileObj = {
          id: p.id,
          email: p.email,
          username: p.username || '',
          full_name: p.full_name || '',
          avatar_emoji: p.avatar_emoji || '🎯',
          group_name: p.group_name || '',
          role: p.role || 'student',
          diagnostic_completed: p.diagnostic_completed === true || p.diagnostic_completed === 'true' || p.diagnostic_completed === 1,
          diagnostic_score: Number(p.diagnostic_score || 0),
          diagnostic_total: Number(p.diagnostic_total || 0),
          diagnostic_completed_at: p.diagnostic_completed_at || null,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        };

        return {
          success: true,
          user: { id: p.id, email: p.email },
          profile: profileObj
        };
      } else {
        return { success: false, error: 'Parol noto\'g\'ri kiritildi' };
      }
    }
  }

  return { success: false, error: 'Foydalanuvchi topilmadi' };
}

function getProfile(userId) {
  if (!userId) return { success: false, error: 'UserId ko\'rsatilmadi' };
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(sheet);

  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    if (p.id === userId) {
      return {
        success: true,
        profile: {
          id: p.id,
          email: p.email,
          username: p.username || '',
          full_name: p.full_name || '',
          avatar_emoji: p.avatar_emoji || '🎯',
          group_name: p.group_name || '',
          role: p.role || 'student',
          diagnostic_completed: p.diagnostic_completed === true || p.diagnostic_completed === 'true' || p.diagnostic_completed === 1,
          diagnostic_score: Number(p.diagnostic_score || 0),
          diagnostic_total: Number(p.diagnostic_total || 0),
          diagnostic_completed_at: p.diagnostic_completed_at || null,
          created_at: p.created_at,
          updated_at: p.updated_at
        }
      };
    }
  }

  return { success: false, error: 'Profil topilmadi' };
}

function updateProfile(data) {
  var userId = data.userId || (data.user && data.user.id);
  if (!userId) return { success: false, error: 'UserId kiritilmadi' };

  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(sheet);

  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    if (p.id === userId) {
      var rowIdx = p._rowIndex;
      var now = new Date().toISOString();

      if (data.full_name !== undefined) sheet.getRange(rowIdx, 5).setValue(data.full_name);
      if (data.avatar_emoji !== undefined) sheet.getRange(rowIdx, 6).setValue(data.avatar_emoji);
      if (data.group_name !== undefined) sheet.getRange(rowIdx, 7).setValue(data.group_name);
      sheet.getRange(rowIdx, 14).setValue(now);

      return { success: true, message: 'Profil muvaffaqiyatli yangilandi' };
    }
  }

  return { success: false, error: 'Foydalanuvchi topilmadi' };
}

function completeDiagnostic(data) {
  var userId = data.userId;
  var score = Number(data.score || 0);
  var total = Number(data.total || 0);
  var answers = JSON.stringify(data.answers || []);
  var percentage = total > 0 ? ((score / total) * 100).toFixed(2) : 0;
  var now = new Date().toISOString();

  var ss = getSpreadsheet();
  var diagSheet = getOrCreateSheet(ss, 'diagnostic_results');
  diagSheet.appendRow([
    'diag_' + Utilities.getUuid(),
    userId,
    score,
    total,
    percentage,
    answers,
    now
  ]);

  var profSheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(profSheet);
  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i].id === userId) {
      var r = profiles[i]._rowIndex;
      profSheet.getRange(r, 9).setValue(true);
      profSheet.getRange(r, 10).setValue(score);
      profSheet.getRange(r, 11).setValue(total);
      profSheet.getRange(r, 12).setValue(now);
      profSheet.getRange(r, 14).setValue(now);
      break;
    }
  }

  return { success: true, message: 'Diagnostik test natijasi saqlandi' };
}

function saveQuizResult(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'quiz_results');

  var id = 'qz_' + Utilities.getUuid();
  var userId = data.userId;
  var topicId = Number(data.topicId || 0);
  var contentItemId = data.contentItemId || '';
  var partId = Number(data.partId || 1);
  var score = Number(data.score || 0);
  var totalQuestions = Number(data.totalQuestions || 0);
  var percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  var xpEarned = score * 10;
  var now = new Date().toISOString();

  sheet.appendRow([
    id,
    userId,
    topicId,
    contentItemId,
    partId,
    score,
    totalQuestions,
    percentage,
    xpEarned,
    now
  ]);

  return { success: true, id: id, xpEarned: xpEarned };
}

function savePracticeResult(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'practice_results');

  var id = 'pr_' + Utilities.getUuid();
  var userId = data.userId;
  var topicId = Number(data.topicId || 0);
  var contentItemId = data.contentItemId || '';
  var score = Number(data.score || 0);
  var maxScore = Number(data.maxScore || 100);
  var xpEarned = maxScore > 0 ? Math.round((score / maxScore) * 50) : 0;
  var now = new Date().toISOString();

  sheet.appendRow([
    id,
    userId,
    topicId,
    contentItemId,
    score,
    maxScore,
    xpEarned,
    now
  ]);

  return { success: true, id: id, xpEarned: xpEarned };
}

function getLeaderboard() {
  var ss = getSpreadsheet();
  var profiles = sheetToObjects(getOrCreateSheet(ss, 'profiles'));
  var quizResults = sheetToObjects(getOrCreateSheet(ss, 'quiz_results'));
  var practiceResults = sheetToObjects(getOrCreateSheet(ss, 'practice_results'));
  var submissions = sheetToObjects(getOrCreateSheet(ss, 'submissions'));

  var userStats = {};

  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    userStats[p.id] = {
      user_id: p.id,
      full_name: p.full_name || p.username || 'Foydalanuvchi',
      avatar_emoji: p.avatar_emoji || '🎯',
      group_name: p.group_name || '',
      diagnostic_score: Number(p.diagnostic_score || 0),
      total_quiz_xp: 0,
      total_quizzes: 0,
      total_quiz_percentage: 0,
      avg_quiz_percentage: 0,
      total_practice_xp: 0,
      total_practices: 0,
      topics_set: {},
      total_xp: 0,
      level: 1
    };
  }

  for (var q = 0; q < quizResults.length; q++) {
    var item = quizResults[q];
    var uid = item.user_id;
    if (userStats[uid]) {
      userStats[uid].total_quiz_xp += Number(item.xp_earned || 0);
      userStats[uid].total_quizzes += 1;
      userStats[uid].total_quiz_percentage += Number(item.percentage || 0);
      if (item.topic_id) userStats[uid].topics_set[item.topic_id] = true;
    }
  }

  for (var pr = 0; pr < practiceResults.length; pr++) {
    var pItem = practiceResults[pr];
    var pUid = pItem.user_id;
    if (userStats[pUid]) {
      userStats[pUid].total_practice_xp += Number(pItem.xp_earned || 0);
      userStats[pUid].total_practices += 1;
      if (pItem.topic_id) userStats[pUid].topics_set[pItem.topic_id] = true;
    }
  }

  for (var s = 0; s < submissions.length; s++) {
    var sub = submissions[s];
    var sUid = sub.user_id;
    if (userStats[sUid] && sub.status === 'graded' && sub.score) {
      userStats[sUid].total_practice_xp += Math.round(Number(sub.score) * 0.5);
    }
  }

  var leaderboard = [];
  for (var k in userStats) {
    var u = userStats[k];
    u.avg_quiz_percentage = u.total_quizzes > 0 ? Math.round(u.total_quiz_percentage / u.total_quizzes) : 0;
    u.topics_completed = Object.keys(u.topics_set).length;
    u.total_xp = u.total_quiz_xp + u.total_practice_xp + (u.diagnostic_score * 5);
    u.level = Math.floor(u.total_xp / 100) + 1;
    delete u.topics_set;
    delete u.total_quiz_percentage;
    leaderboard.push(u);
  }

  leaderboard.sort(function(a, b) {
    return b.total_xp - a.total_xp;
  });

  return { success: true, leaderboard: leaderboard };
}

function getContentItems(type, status) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'content_items');
  var items = sheetToObjects(sheet);

  var result = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (type && it.content_type !== type) continue;
    if (status && it.status !== status) continue;

    var questions = [];
    try {
      questions = it.questions ? JSON.parse(it.questions) : [];
    } catch (e) {
      questions = [];
    }

    var practice = {};
    try {
      practice = it.practice ? JSON.parse(it.practice) : {};
    } catch (e) {
      practice = {};
    }

    result.push({
      id: it.id,
      content_type: it.content_type,
      title: it.title,
      description: it.description || '',
      body: it.body || '',
      topic_id: it.topic_id ? Number(it.topic_id) : null,
      questions: questions,
      practice: practice,
      status: it.status || 'published',
      created_by: it.created_by || null,
      created_at: it.created_at,
      updated_at: it.updated_at
    });
  }

  result.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return { success: true, items: result };
}

function getContentItem(id) {
  var res = getContentItems();
  for (var i = 0; i < res.items.length; i++) {
    if (res.items[i].id === id) {
      return { success: true, item: res.items[i] };
    }
  }
  return { success: false, error: 'Kontent topilmadi' };
}

function saveContentItem(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'content_items');
  var items = sheetToObjects(sheet);
  var now = new Date().toISOString();

  var id = data.id;
  var isEdit = false;
  var rowIdx = -1;

  if (id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        isEdit = true;
        rowIdx = items[i]._rowIndex;
        break;
      }
    }
  }

  var questionsStr = typeof data.questions === 'string' ? data.questions : JSON.stringify(data.questions || []);
  var practiceStr = typeof data.practice === 'string' ? data.practice : JSON.stringify(data.practice || {});

  if (isEdit) {
    sheet.getRange(rowIdx, 2).setValue(data.content_type || 'material');
    sheet.getRange(rowIdx, 3).setValue(data.title || '');
    sheet.getRange(rowIdx, 4).setValue(data.description || '');
    sheet.getRange(rowIdx, 5).setValue(data.body || '');
    sheet.getRange(rowIdx, 6).setValue(data.topic_id || '');
    sheet.getRange(rowIdx, 7).setValue(questionsStr);
    sheet.getRange(rowIdx, 8).setValue(practiceStr);
    sheet.getRange(rowIdx, 9).setValue(data.status || 'published');
    sheet.getRange(rowIdx, 12).setValue(now);

    return { success: true, id: id, message: 'Kontent yangilandi' };
  } else {
    var newId = 'cnt_' + Utilities.getUuid();
    sheet.appendRow([
      newId,
      data.content_type || 'material',
      data.title || '',
      data.description || '',
      data.body || '',
      data.topic_id || '',
      questionsStr,
      practiceStr,
      data.status || 'published',
      data.created_by || '',
      now,
      now
    ]);

    return { success: true, id: newId, message: 'Yangi kontent qo\'shildi' };
  }
}

function deleteContentItem(id) {
  if (!id) return { success: false, error: 'ID berilmadi' };
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'content_items');
  var items = sheetToObjects(sheet);

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      sheet.deleteRow(items[i]._rowIndex);
      return { success: true, message: 'Kontent o\'chirildi' };
    }
  }
  return { success: false, error: 'Kontent topilmadi' };
}

function uploadSubmission(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'submissions');
  var items = sheetToObjects(sheet);
  var now = new Date().toISOString();

  var userId = data.userId;
  var contentItemId = data.contentItemId;
  var fileName = data.fileName || 'topshiriq.docx';
  var fileSize = Number(data.fileSize || 0);
  var fileData = data.fileData || '';

  var existingRow = -1;
  var existingId = null;

  for (var i = 0; i < items.length; i++) {
    if (items[i].user_id === userId && items[i].content_item_id === contentItemId) {
      existingRow = items[i]._rowIndex;
      existingId = items[i].id;
      break;
    }
  }

  if (existingRow !== -1) {
    sheet.getRange(existingRow, 4).setValue(fileName);
    sheet.getRange(existingRow, 5).setValue(fileSize);
    sheet.getRange(existingRow, 6).setValue(fileData);
    sheet.getRange(existingRow, 7).setValue('pending');
    sheet.getRange(existingRow, 8).setValue('');
    sheet.getRange(existingRow, 9).setValue('');
    sheet.getRange(existingRow, 10).setValue('');
    sheet.getRange(existingRow, 11).setValue('');
    sheet.getRange(existingRow, 13).setValue(now);

    return { success: true, id: existingId, message: 'Fayl qayta yuklandi' };
  } else {
    var newId = 'sub_' + Utilities.getUuid();
    sheet.appendRow([
      newId,
      userId,
      contentItemId,
      fileName,
      fileSize,
      fileData,
      'pending',
      '',
      '',
      '',
      '',
      now,
      now
    ]);

    return { success: true, id: newId, message: 'Fayl muvaffaqiyatli yuklandi' };
  }
}

function getSubmissions(params) {
  var ss = getSpreadsheet();
  var subSheet = getOrCreateSheet(ss, 'submissions');
  var submissions = sheetToObjects(subSheet);
  var profiles = sheetToObjects(getOrCreateSheet(ss, 'profiles'));
  var contents = sheetToObjects(getOrCreateSheet(ss, 'content_items'));

  var profileMap = {};
  for (var i = 0; i < profiles.length; i++) {
    profileMap[profiles[i].id] = profiles[i];
  }

  var contentMap = {};
  for (var j = 0; j < contents.length; j++) {
    contentMap[contents[j].id] = contents[j];
  }

  var results = [];
  for (var k = 0; k < submissions.length; k++) {
    var s = submissions[k];
    var prof = profileMap[s.user_id] || {};
    var cont = contentMap[s.content_item_id] || {};

    if (params && params.status && params.status !== 'all' && s.status !== params.status) {
      continue;
    }
    if (params && params.contentItemId && s.content_item_id !== params.contentItemId) {
      continue;
    }
    if (params && params.group && prof.group_name !== params.group) {
      continue;
    }

    results.push({
      id: s.id,
      user_id: s.user_id,
      content_item_id: s.content_item_id,
      file_path: s.file_name,
      file_name: s.file_name,
      file_size: Number(s.file_size || 0),
      file_data: s.file_data || '',
      status: s.status || 'pending',
      score: s.score !== '' && s.score !== null ? Number(s.score) : null,
      feedback: s.feedback || null,
      graded_by: s.graded_by || null,
      graded_at: s.graded_at || null,
      created_at: s.created_at,
      updated_at: s.updated_at,
      profiles: {
        full_name: prof.full_name || 'Noma\'lum',
        group_name: prof.group_name || '',
        avatar_emoji: prof.avatar_emoji || '🎯'
      },
      content_items: {
        title: cont.title || 'Mavzu',
        topic_id: cont.topic_id ? Number(cont.topic_id) : 1
      }
    });
  }

  results.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return { success: true, submissions: results };
}

function getMySubmissions(userId) {
  var all = getSubmissions({});
  var my = [];
  for (var i = 0; i < all.submissions.length; i++) {
    if (all.submissions[i].user_id === userId) {
      my.push(all.submissions[i]);
    }
  }
  return { success: true, submissions: my };
}

function gradeSubmission(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'submissions');
  var items = sheetToObjects(sheet);
  var subId = data.submissionId;
  var score = Number(data.score || 0);
  var feedback = data.feedback || '';
  var gradedBy = data.gradedBy || '';
  var now = new Date().toISOString();

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === subId) {
      var r = items[i]._rowIndex;
      sheet.getRange(r, 7).setValue('graded');
      sheet.getRange(r, 8).setValue(score);
      sheet.getRange(r, 9).setValue(feedback);
      sheet.getRange(r, 10).setValue(gradedBy);
      sheet.getRange(r, 11).setValue(now);
      sheet.getRange(r, 13).setValue(now);

      return { success: true, message: 'Topshiriq baholandi' };
    }
  }

  return { success: false, error: 'Topshiriq topilmadi' };
}

function downloadFile(submissionId) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'submissions');
  var items = sheetToObjects(sheet);

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === submissionId) {
      return {
        success: true,
        fileName: items[i].file_name,
        fileData: items[i].file_data,
        fileSize: items[i].file_size
      };
    }
  }
  return { success: false, error: 'Fayl topilmadi' };
}

function submitRoleRequest(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'role_requests');
  var items = sheetToObjects(sheet);
  var userId = data.userId;
  var now = new Date().toISOString();

  for (var i = 0; i < items.length; i++) {
    if (items[i].user_id === userId && items[i].status === 'pending') {
      return { success: false, error: 'Siz allaqachon so\'rov yuborgansiz' };
    }
  }

  var id = 'req_' + Utilities.getUuid();
  sheet.appendRow([
    id,
    userId,
    'pending',
    '',
    '',
    now,
    now
  ]);

  return { success: true, id: id, message: 'So\'rov yuborildi' };
}

function getRoleRequests() {
  var ss = getSpreadsheet();
  var reqSheet = getOrCreateSheet(ss, 'role_requests');
  var requests = sheetToObjects(reqSheet);
  var profiles = sheetToObjects(getOrCreateSheet(ss, 'profiles'));

  var profileMap = {};
  for (var i = 0; i < profiles.length; i++) {
    profileMap[profiles[i].id] = profiles[i];
  }

  var results = [];
  for (var j = 0; j < requests.length; j++) {
    var r = requests[j];
    var p = profileMap[r.user_id] || {};
    results.push({
      id: r.id,
      user_id: r.user_id,
      status: r.status || 'pending',
      reviewed_by: r.reviewed_by || null,
      reviewed_at: r.reviewed_at || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      profiles: {
        id: p.id,
        full_name: p.full_name || 'Noma\'lum',
        username: p.username || '',
        avatar_emoji: p.avatar_emoji || '🎯',
        group_name: p.group_name || '',
        role: p.role || 'student'
      }
    });
  }

  results.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return { success: true, requests: results };
}

function getMyRoleRequest(userId) {
  var all = getRoleRequests();
  for (var i = 0; i < all.requests.length; i++) {
    if (all.requests[i].user_id === userId) {
      return { success: true, request: all.requests[i] };
    }
  }
  return { success: true, request: null };
}

function reviewRoleRequest(data) {
  var ss = getSpreadsheet();
  var reqSheet = getOrCreateSheet(ss, 'role_requests');
  var requests = sheetToObjects(reqSheet);
  var reqId = data.requestId;
  var approved = data.approved === true;
  var reviewerId = data.reviewerId || '';
  var now = new Date().toISOString();

  for (var i = 0; i < requests.length; i++) {
    var r = requests[i];
    if (r.id === reqId) {
      var rowIdx = r._rowIndex;
      var newStatus = approved ? 'approved' : 'rejected';
      reqSheet.getRange(rowIdx, 3).setValue(newStatus);
      reqSheet.getRange(rowIdx, 4).setValue(reviewerId);
      reqSheet.getRange(rowIdx, 5).setValue(now);
      reqSheet.getRange(rowIdx, 7).setValue(now);

      if (approved) {
        var profSheet = getOrCreateSheet(ss, 'profiles');
        var profiles = sheetToObjects(profSheet);
        for (var p = 0; p < profiles.length; p++) {
          if (profiles[p].id === r.user_id) {
            profSheet.getRange(profiles[p]._rowIndex, 8).setValue('teacher');
            profSheet.getRange(profiles[p]._rowIndex, 14).setValue(now);
            break;
          }
        }
      }

      return { success: true, message: approved ? 'O\'qituvchi roli berildi' : 'So\'rov rad etildi' };
    }
  }

  return { success: false, error: 'So\'rov topilmadi' };
}

function getUsers() {
  var ss = getSpreadsheet();
  var profiles = sheetToObjects(getOrCreateSheet(ss, 'profiles'));
  var result = [];

  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    result.push({
      id: p.id,
      email: p.email,
      username: p.username || '',
      full_name: p.full_name || '',
      avatar_emoji: p.avatar_emoji || '🎯',
      group_name: p.group_name || '',
      role: p.role || 'student',
      diagnostic_completed: p.diagnostic_completed === true || p.diagnostic_completed === 'true' || p.diagnostic_completed === 1,
      diagnostic_score: Number(p.diagnostic_score || 0),
      diagnostic_total: Number(p.diagnostic_total || 0),
      diagnostic_completed_at: p.diagnostic_completed_at || null,
      created_at: p.created_at,
      updated_at: p.updated_at
    });
  }

  result.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return { success: true, users: result };
}

function setUserRole(data) {
  var ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, 'profiles');
  var profiles = sheetToObjects(sheet);
  var userId = data.userId;
  var role = data.role;
  var now = new Date().toISOString();

  for (var i = 0; i < profiles.length; i++) {
    if (profiles[i].id === userId) {
      sheet.getRange(profiles[i]._rowIndex, 8).setValue(role);
      sheet.getRange(profiles[i]._rowIndex, 14).setValue(now);
      return { success: true, message: 'Foydalanuvchi roli yangilandi' };
    }
  }
  return { success: false, error: 'Foydalanuvchi topilmadi' };
}

function getTeacherData() {
  var ss = getSpreadsheet();
  var profiles = sheetToObjects(getOrCreateSheet(ss, 'profiles'));
  var quizResults = sheetToObjects(getOrCreateSheet(ss, 'quiz_results'));
  var practiceResults = sheetToObjects(getOrCreateSheet(ss, 'practice_results'));
  var contents = sheetToObjects(getOrCreateSheet(ss, 'content_items'));

  var profileMap = {};
  var students = [];
  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    profileMap[p.id] = p;
    if (p.role === 'student') {
      students.push({
        id: p.id,
        email: p.email,
        username: p.username || '',
        full_name: p.full_name || '',
        avatar_emoji: p.avatar_emoji || '🎯',
        group_name: p.group_name || '',
        role: p.role,
        diagnostic_completed: p.diagnostic_completed,
        diagnostic_score: p.diagnostic_score,
        diagnostic_total: p.diagnostic_total,
        created_at: p.created_at,
        updated_at: p.updated_at
      });
    }
  }

  var contentMap = {};
  for (var j = 0; j < contents.length; j++) {
    contentMap[contents[j].id] = contents[j];
  }

  var formattedQuizzes = [];
  for (var q = 0; q < quizResults.length; q++) {
    var qz = quizResults[q];
    var qProf = profileMap[qz.user_id] || {};
    var qCont = contentMap[qz.content_item_id] || {};
    formattedQuizzes.push({
      id: qz.id,
      user_id: qz.user_id,
      topic_id: Number(qz.topic_id || 0),
      score: Number(qz.score || 0),
      total_questions: Number(qz.total_questions || 0),
      percentage: Number(qz.percentage || 0),
      xp_earned: Number(qz.xp_earned || 0),
      completed_at: qz.completed_at,
      profiles: {
        full_name: qProf.full_name || 'Talaba',
        group_name: qProf.group_name || '',
        avatar_emoji: qProf.avatar_emoji || '🎯'
      },
      content_items: {
        title: qCont.title || ('Mavzu ' + qz.topic_id)
      }
    });
  }

  var formattedPractices = [];
  for (var pr = 0; pr < practiceResults.length; pr++) {
    var prc = practiceResults[pr];
    var prCont = contentMap[prc.content_item_id] || {};
    formattedPractices.push({
      id: prc.id,
      user_id: prc.user_id,
      topic_id: Number(prc.topic_id || 0),
      score: Number(prc.score || 0),
      max_score: Number(prc.max_score || 100),
      xp_earned: Number(prc.xp_earned || 0),
      completed_at: prc.completed_at,
      content_items: {
        title: prCont.title || ('Amaliyot ' + prc.topic_id)
      }
    });
  }

  return {
    success: true,
    students: students,
    quizResults: formattedQuizzes,
    practiceResults: formattedPractices
  };
}


function seedRichDatabase() {
  var ss = getSpreadsheet();
  initDatabase();

  // 1. SEED PROFILES (Kamida 160 talaba)
  var profSheet = ss.getSheetByName('profiles');
  var existingProfs = sheetToObjects(profSheet);
  var existingEmails = {};
  for (var ep = 0; ep < existingProfs.length; ep++) {
    existingEmails[(existingProfs[ep].email || '').toLowerCase()] = true;
  }

  var newStudentRows = [];
  var studentIds = [];
  var studentNames = [];
  if (!existingEmails["aziz_aliyev1@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_001", "aziz_aliyev1@digitaledu.uz", 'Student2024!', "aziz_aliyev", "Aziz Aliyev",
      "🎓", "CS-101", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_001");
  studentNames.push("Aziz Aliyev");
  if (!existingEmails["hilola_aliyeva2@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_002", "hilola_aliyeva2@digitaledu.uz", 'Student2024!', "hilola_aliyeva", "Hilola Aliyeva",
      "🎯", "CS-102", 'student', true, 10, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_002");
  studentNames.push("Hilola Aliyeva");
  if (!existingEmails["dilshod_karimov3@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_003", "dilshod_karimov3@digitaledu.uz", 'Student2024!', "dilshod_karimov", "Dilshod Karimov",
      "💡", "CS-201", 'student', true, 11, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_003");
  studentNames.push("Dilshod Karimov");
  if (!existingEmails["kamola_karimova4@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_004", "kamola_karimova4@digitaledu.uz", 'Student2024!', "kamola_karimova", "Kamola Karimova",
      "⚡", "CS-202", 'student', true, 12, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_004");
  studentNames.push("Kamola Karimova");
  if (!existingEmails["farrux_rashidov5@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_005", "farrux_rashidov5@digitaledu.uz", 'Student2024!', "farrux_rashidov", "Farrux Rashidov",
      "🚀", "PED-101", 'student', true, 13, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_005");
  studentNames.push("Farrux Rashidov");
  if (!existingEmails["nodira_rashidova6@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_006", "nodira_rashidova6@digitaledu.uz", 'Student2024!', "nodira_rashidova", "Nodira Rashidova",
      "⭐", "PED-102", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_006");
  studentNames.push("Nodira Rashidova");
  if (!existingEmails["kamron_yusupov7@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_007", "kamron_yusupov7@digitaledu.uz", 'Student2024!', "kamron_yusupov", "Kamron Yusupov",
      "🧠", "PED-201", 'student', true, 15, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_007");
  studentNames.push("Kamron Yusupov");
  if (!existingEmails["umida_yusupova8@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_008", "umida_yusupova8@digitaledu.uz", 'Student2024!', "umida_yusupova", "Umida Yusupova",
      "📚", "PED-202", 'student', true, 9, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_008");
  studentNames.push("Umida Yusupova");
  if (!existingEmails["otabek_nazarov9@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_009", "otabek_nazarov9@digitaledu.uz", 'Student2024!', "otabek_nazarov", "Otabek Nazarov",
      "🏆", "DI-101", 'student', true, 10, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_009");
  studentNames.push("Otabek Nazarov");
  if (!existingEmails["zarina_nazarova10@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_010", "zarina_nazarova10@digitaledu.uz", 'Student2024!', "zarina_nazarova", "Zarina Nazarova",
      "💎", "DI-201", 'student', true, 11, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_010");
  studentNames.push("Zarina Nazarova");
  if (!existingEmails["temur_sobirov11@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_011", "temur_sobirov11@digitaledu.uz", 'Student2024!', "temur_sobirov", "Temur Sobirov",
      "🌟", "MAT-101", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_011");
  studentNames.push("Temur Sobirov");
  if (!existingEmails["feruza_sobirova12@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_012", "feruza_sobirova12@digitaledu.uz", 'Student2024!', "feruza_sobirova", "Feruza Sobirova",
      "🎓", "INF-201", 'student', true, 13, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_012");
  studentNames.push("Feruza Sobirova");
  if (!existingEmails["zafar_tursunov13@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_013", "zafar_tursunov13@digitaledu.uz", 'Student2024!', "zafar_tursunov", "Zafar Tursunov",
      "🎯", "CS-101", 'student', true, 14, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_013");
  studentNames.push("Zafar Tursunov");
  if (!existingEmails["lola_tursunova14@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_014", "lola_tursunova14@digitaledu.uz", 'Student2024!', "lola_tursunova", "Lola Tursunova",
      "💡", "CS-102", 'student', true, 15, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_014");
  studentNames.push("Lola Tursunova");
  if (!existingEmails["bobur_ergashev15@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_015", "bobur_ergashev15@digitaledu.uz", 'Student2024!', "bobur_ergashev", "Bobur Ergashev",
      "⚡", "CS-201", 'student', true, 9, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_015");
  studentNames.push("Bobur Ergashev");
  if (!existingEmails["nargiza_ergasheva16@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_016", "nargiza_ergasheva16@digitaledu.uz", 'Student2024!', "nargiza_ergasheva", "Nargiza Ergasheva",
      "🚀", "CS-202", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_016");
  studentNames.push("Nargiza Ergasheva");
  if (!existingEmails["husan_rahimov17@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_017", "husan_rahimov17@digitaledu.uz", 'Student2024!', "husan_rahimov", "Husan Rahimov",
      "⭐", "PED-101", 'student', true, 11, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_017");
  studentNames.push("Husan Rahimov");
  if (!existingEmails["shahnoza_rahimova18@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_018", "shahnoza_rahimova18@digitaledu.uz", 'Student2024!', "shahnoza_rahimova", "Shahnoza Rahimova",
      "🧠", "PED-102", 'student', true, 12, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_018");
  studentNames.push("Shahnoza Rahimova");
  if (!existingEmails["javohir_saidov19@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_019", "javohir_saidov19@digitaledu.uz", 'Student2024!', "javohir_saidov", "Javohir Saidov",
      "📚", "PED-201", 'student', true, 13, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_019");
  studentNames.push("Javohir Saidov");
  if (!existingEmails["nilufar_saidova20@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_020", "nilufar_saidova20@digitaledu.uz", 'Student2024!', "nilufar_saidova", "Nilufar Saidova",
      "🏆", "PED-202", 'student', true, 14, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_020");
  studentNames.push("Nilufar Saidova");
  if (!existingEmails["oybek_ismoilov21@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_021", "oybek_ismoilov21@digitaledu.uz", 'Student2024!', "oybek_ismoilov", "Oybek Ismoilov",
      "💎", "DI-101", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_021");
  studentNames.push("Oybek Ismoilov");
  if (!existingEmails["robiya_ismoilova22@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_022", "robiya_ismoilova22@digitaledu.uz", 'Student2024!', "robiya_ismoilova", "Robiya Ismoilova",
      "🌟", "DI-201", 'student', true, 9, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_022");
  studentNames.push("Robiya Ismoilova");
  if (!existingEmails["shahzod_mirzayev23@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_023", "shahzod_mirzayev23@digitaledu.uz", 'Student2024!', "shahzod_mirzayev", "Shahzod Mirzayev",
      "🎓", "MAT-101", 'student', true, 10, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_023");
  studentNames.push("Shahzod Mirzayev");
  if (!existingEmails["zilola_mirzayeva24@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_024", "zilola_mirzayeva24@digitaledu.uz", 'Student2024!', "zilola_mirzayeva", "Zilola Mirzayeva",
      "🎯", "INF-201", 'student', true, 11, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_024");
  studentNames.push("Zilola Mirzayeva");
  if (!existingEmails["umar_abdullayev25@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_025", "umar_abdullayev25@digitaledu.uz", 'Student2024!', "umar_abdullayev", "Umar Abdullayev",
      "💡", "CS-101", 'student', true, 12, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_025");
  studentNames.push("Umar Abdullayev");
  if (!existingEmails["mohira_abdullayeva26@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_026", "mohira_abdullayeva26@digitaledu.uz", 'Student2024!', "mohira_abdullayeva", "Mohira Abdullayeva",
      "⚡", "CS-102", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_026");
  studentNames.push("Mohira Abdullayeva");
  if (!existingEmails["yorqin_xolmatov27@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_027", "yorqin_xolmatov27@digitaledu.uz", 'Student2024!', "yorqin_xolmatov", "Yorqin Xolmatov",
      "🚀", "CS-201", 'student', true, 14, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_027");
  studentNames.push("Yorqin Xolmatov");
  if (!existingEmails["gulchehra_xolmatova28@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_028", "gulchehra_xolmatova28@digitaledu.uz", 'Student2024!', "gulchehra_xolmatova", "Gulchehra Xolmatova",
      "⭐", "CS-202", 'student', true, 15, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_028");
  studentNames.push("Gulchehra Xolmatova");
  if (!existingEmails["sanjar_qosimov29@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_029", "sanjar_qosimov29@digitaledu.uz", 'Student2024!', "sanjar_qosimov", "Sanjar Qosimov",
      "🧠", "PED-101", 'student', true, 9, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_029");
  studentNames.push("Sanjar Qosimov");
  if (!existingEmails["shahzoda_qosimova30@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_030", "shahzoda_qosimova30@digitaledu.uz", 'Student2024!', "shahzoda_qosimova", "Shahzoda Qosimova",
      "📚", "PED-102", 'student', true, 10, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_030");
  studentNames.push("Shahzoda Qosimova");
  if (!existingEmails["nodir_yoldoshev31@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_031", "nodir_yoldoshev31@digitaledu.uz", 'Student2024!', "nodir_yoldoshev", "Nodir Yoldoshev",
      "🏆", "PED-201", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_031");
  studentNames.push("Nodir Yoldoshev");
  if (!existingEmails["gozal_yoldosheva32@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_032", "gozal_yoldosheva32@digitaledu.uz", 'Student2024!', "gozal_yoldosheva", "Gozal Yoldosheva",
      "💎", "PED-202", 'student', true, 12, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_032");
  studentNames.push("Gozal Yoldosheva");
  if (!existingEmails["shavkat_hasanov33@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_033", "shavkat_hasanov33@digitaledu.uz", 'Student2024!', "shavkat_hasanov", "Shavkat Hasanov",
      "🌟", "DI-101", 'student', true, 13, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_033");
  studentNames.push("Shavkat Hasanov");
  if (!existingEmails["charos_hasanova34@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_034", "charos_hasanova34@digitaledu.uz", 'Student2024!', "charos_hasanova", "Charos Hasanova",
      "🎓", "DI-201", 'student', true, 14, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_034");
  studentNames.push("Charos Hasanova");
  if (!existingEmails["doston_umarov35@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_035", "doston_umarov35@digitaledu.uz", 'Student2024!', "doston_umarov", "Doston Umarov",
      "🎯", "MAT-101", 'student', true, 15, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_035");
  studentNames.push("Doston Umarov");
  if (!existingEmails["dilafroz_umarova36@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_036", "dilafroz_umarova36@digitaledu.uz", 'Student2024!', "dilafroz_umarova", "Dilafroz Umarova",
      "💡", "INF-201", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_036");
  studentNames.push("Dilafroz Umarova");
  if (!existingEmails["botir_bekmurodov37@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_037", "botir_bekmurodov37@digitaledu.uz", 'Student2024!', "botir_bekmurodov", "Botir Bekmurodov",
      "⚡", "CS-101", 'student', true, 10, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_037");
  studentNames.push("Botir Bekmurodov");
  if (!existingEmails["laylo_bekmurodova38@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_038", "laylo_bekmurodova38@digitaledu.uz", 'Student2024!', "laylo_bekmurodova", "Laylo Bekmurodova",
      "🚀", "CS-102", 'student', true, 11, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_038");
  studentNames.push("Laylo Bekmurodova");
  if (!existingEmails["asadbek_tashpulatov39@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_039", "asadbek_tashpulatov39@digitaledu.uz", 'Student2024!', "asadbek_tashpulatov", "Asadbek Tashpulatov",
      "⭐", "CS-201", 'student', true, 12, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_039");
  studentNames.push("Asadbek Tashpulatov");
  if (!existingEmails["gulnora_tashpulatova40@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_040", "gulnora_tashpulatova40@digitaledu.uz", 'Student2024!', "gulnora_tashpulatova", "Gulnora Tashpulatova",
      "🧠", "CS-202", 'student', true, 13, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_040");
  studentNames.push("Gulnora Tashpulatova");
  if (!existingEmails["mansurbek_sharipov41@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_041", "mansurbek_sharipov41@digitaledu.uz", 'Student2024!', "mansurbek_sharipov", "Mansurbek Sharipov",
      "📚", "PED-101", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_041");
  studentNames.push("Mansurbek Sharipov");
  if (!existingEmails["iroda_sharipova42@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_042", "iroda_sharipova42@digitaledu.uz", 'Student2024!', "iroda_sharipova", "Iroda Sharipova",
      "🏆", "PED-102", 'student', true, 15, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_042");
  studentNames.push("Iroda Sharipova");
  if (!existingEmails["jaloliddin_mahmudov43@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_043", "jaloliddin_mahmudov43@digitaledu.uz", 'Student2024!', "jaloliddin_mahmudov", "Jaloliddin Mahmudov",
      "💎", "PED-201", 'student', true, 9, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_043");
  studentNames.push("Jaloliddin Mahmudov");
  if (!existingEmails["madina_mahmudova44@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_044", "madina_mahmudova44@digitaledu.uz", 'Student2024!', "madina_mahmudova", "Madina Mahmudova",
      "🌟", "PED-202", 'student', true, 10, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_044");
  studentNames.push("Madina Mahmudova");
  if (!existingEmails["ulugbek_olimov45@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_045", "ulugbek_olimov45@digitaledu.uz", 'Student2024!', "ulugbek_olimov", "Ulugbek Olimov",
      "🎓", "DI-101", 'student', true, 11, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_045");
  studentNames.push("Ulugbek Olimov");
  if (!existingEmails["sevara_olimova46@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_046", "sevara_olimova46@digitaledu.uz", 'Student2024!', "sevara_olimova", "Sevara Olimova",
      "🎯", "DI-201", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_046");
  studentNames.push("Sevara Olimova");
  if (!existingEmails["islom_tojiyev47@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_047", "islom_tojiyev47@digitaledu.uz", 'Student2024!', "islom_tojiyev", "Islom Tojiyev",
      "💡", "MAT-101", 'student', true, 13, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_047");
  studentNames.push("Islom Tojiyev");
  if (!existingEmails["yulduz_tojiyeva48@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_048", "yulduz_tojiyeva48@digitaledu.uz", 'Student2024!', "yulduz_tojiyeva", "Yulduz Tojiyeva",
      "⚡", "INF-201", 'student', true, 14, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_048");
  studentNames.push("Yulduz Tojiyeva");
  if (!existingEmails["bekzod_qodirov49@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_049", "bekzod_qodirov49@digitaledu.uz", 'Student2024!', "bekzod_qodirov", "Bekzod Qodirov",
      "🚀", "CS-101", 'student', true, 15, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_049");
  studentNames.push("Bekzod Qodirov");
  if (!existingEmails["dilnoza_qodirova50@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_050", "dilnoza_qodirova50@digitaledu.uz", 'Student2024!', "dilnoza_qodirova", "Dilnoza Qodirova",
      "⭐", "CS-102", 'student', true, 9, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_050");
  studentNames.push("Dilnoza Qodirova");
  if (!existingEmails["eldor_sultonov51@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_051", "eldor_sultonov51@digitaledu.uz", 'Student2024!', "eldor_sultonov", "Eldor Sultonov",
      "🧠", "CS-201", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_051");
  studentNames.push("Eldor Sultonov");
  if (!existingEmails["gulbahor_sultonova52@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_052", "gulbahor_sultonova52@digitaledu.uz", 'Student2024!', "gulbahor_sultonova", "Gulbahor Sultonova",
      "📚", "CS-202", 'student', true, 11, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_052");
  studentNames.push("Gulbahor Sultonova");
  if (!existingEmails["jasur_yoqubov53@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_053", "jasur_yoqubov53@digitaledu.uz", 'Student2024!', "jasur_yoqubov", "Jasur Yoqubov",
      "🏆", "PED-101", 'student', true, 12, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_053");
  studentNames.push("Jasur Yoqubov");
  if (!existingEmails["munisa_yoqubova54@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_054", "munisa_yoqubova54@digitaledu.uz", 'Student2024!', "munisa_yoqubova", "Munisa Yoqubova",
      "💎", "PED-102", 'student', true, 13, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_054");
  studentNames.push("Munisa Yoqubova");
  if (!existingEmails["laziz_mamatov55@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_055", "laziz_mamatov55@digitaledu.uz", 'Student2024!', "laziz_mamatov", "Laziz Mamatov",
      "🌟", "PED-201", 'student', true, 14, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_055");
  studentNames.push("Laziz Mamatov");
  if (!existingEmails["parvina_mamatova56@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_056", "parvina_mamatova56@digitaledu.uz", 'Student2024!', "parvina_mamatova", "Parvina Mamatova",
      "🎓", "PED-202", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_056");
  studentNames.push("Parvina Mamatova");
  if (!existingEmails["rustam_xudoyberdiyev57@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_057", "rustam_xudoyberdiyev57@digitaledu.uz", 'Student2024!', "rustam_xudoyberdiyev", "Rustam Xudoyberdiyev",
      "🎯", "DI-101", 'student', true, 9, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_057");
  studentNames.push("Rustam Xudoyberdiyev");
  if (!existingEmails["malika_xudoyberdiyeva58@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_058", "malika_xudoyberdiyeva58@digitaledu.uz", 'Student2024!', "malika_xudoyberdiyeva", "Malika Xudoyberdiyeva",
      "💡", "DI-201", 'student', true, 10, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_058");
  studentNames.push("Malika Xudoyberdiyeva");
  if (!existingEmails["xurshid_toshmatov59@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_059", "xurshid_toshmatov59@digitaledu.uz", 'Student2024!', "xurshid_toshmatov", "Xurshid Toshmatov",
      "⚡", "MAT-101", 'student', true, 11, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_059");
  studentNames.push("Xurshid Toshmatov");
  if (!existingEmails["ozoda_toshmatova60@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_060", "ozoda_toshmatova60@digitaledu.uz", 'Student2024!', "ozoda_toshmatova", "Ozoda Toshmatova",
      "🚀", "INF-201", 'student', true, 12, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_060");
  studentNames.push("Ozoda Toshmatova");
  if (!existingEmails["akmal_normurodov61@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_061", "akmal_normurodov61@digitaledu.uz", 'Student2024!', "akmal_normurodov", "Akmal Normurodov",
      "⭐", "CS-101", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_061");
  studentNames.push("Akmal Normurodov");
  if (!existingEmails["sabina_normurodova62@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_062", "sabina_normurodova62@digitaledu.uz", 'Student2024!', "sabina_normurodova", "Sabina Normurodova",
      "🧠", "CS-102", 'student', true, 14, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_062");
  studentNames.push("Sabina Normurodova");
  if (!existingEmails["elyor_berdiyev63@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_063", "elyor_berdiyev63@digitaledu.uz", 'Student2024!', "elyor_berdiyev", "Elyor Berdiyev",
      "📚", "CS-201", 'student', true, 15, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_063");
  studentNames.push("Elyor Berdiyev");
  if (!existingEmails["rayhona_berdiyeva64@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_064", "rayhona_berdiyeva64@digitaledu.uz", 'Student2024!', "rayhona_berdiyeva", "Rayhona Berdiyeva",
      "🏆", "CS-202", 'student', true, 9, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_064");
  studentNames.push("Rayhona Berdiyeva");
  if (!existingEmails["ikrom_ganiyev65@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_065", "ikrom_ganiyev65@digitaledu.uz", 'Student2024!', "ikrom_ganiyev", "Ikrom Ganiyev",
      "💎", "PED-101", 'student', true, 10, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_065");
  studentNames.push("Ikrom Ganiyev");
  if (!existingEmails["shaxlo_ganiyeva66@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_066", "shaxlo_ganiyeva66@digitaledu.uz", 'Student2024!', "shaxlo_ganiyeva", "Shaxlo Ganiyeva",
      "🌟", "PED-102", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_066");
  studentNames.push("Shaxlo Ganiyeva");
  if (!existingEmails["komil_bozorov67@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_067", "komil_bozorov67@digitaledu.uz", 'Student2024!', "komil_bozorov", "Komil Bozorov",
      "🎓", "PED-201", 'student', true, 12, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_067");
  studentNames.push("Komil Bozorov");
  if (!existingEmails["dildora_bozorova68@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_068", "dildora_bozorova68@digitaledu.uz", 'Student2024!', "dildora_bozorova", "Dildora Bozorova",
      "🎯", "PED-202", 'student', true, 13, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_068");
  studentNames.push("Dildora Bozorova");
  if (!existingEmails["ravshan_haydarov69@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_069", "ravshan_haydarov69@digitaledu.uz", 'Student2024!', "ravshan_haydarov", "Ravshan Haydarov",
      "💡", "DI-101", 'student', true, 14, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_069");
  studentNames.push("Ravshan Haydarov");
  if (!existingEmails["diyora_haydarova70@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_070", "diyora_haydarova70@digitaledu.uz", 'Student2024!', "diyora_haydarova", "Diyora Haydarova",
      "⚡", "DI-201", 'student', true, 15, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_070");
  studentNames.push("Diyora Haydarova");
  if (!existingEmails["tohir_ochilov71@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_071", "tohir_ochilov71@digitaledu.uz", 'Student2024!', "tohir_ochilov", "Tohir Ochilov",
      "🚀", "MAT-101", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_071");
  studentNames.push("Tohir Ochilov");
  if (!existingEmails["sarvinoz_ochilova72@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_072", "sarvinoz_ochilova72@digitaledu.uz", 'Student2024!', "sarvinoz_ochilova", "Sarvinoz Ochilova",
      "⭐", "INF-201", 'student', true, 10, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_072");
  studentNames.push("Sarvinoz Ochilova");
  if (!existingEmails["vohid_boboyev73@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_073", "vohid_boboyev73@digitaledu.uz", 'Student2024!', "vohid_boboyev", "Vohid Boboyev",
      "🧠", "CS-101", 'student', true, 11, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_073");
  studentNames.push("Vohid Boboyev");
  if (!existingEmails["barno_boboyeva74@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_074", "barno_boboyeva74@digitaledu.uz", 'Student2024!', "barno_boboyeva", "Barno Boboyeva",
      "📚", "CS-102", 'student', true, 12, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_074");
  studentNames.push("Barno Boboyeva");
  if (!existingEmails["sardor_rustamov75@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_075", "sardor_rustamov75@digitaledu.uz", 'Student2024!', "sardor_rustamov", "Sardor Rustamov",
      "🏆", "CS-201", 'student', true, 13, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_075");
  studentNames.push("Sardor Rustamov");
  if (!existingEmails["maftuna_rustamova76@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_076", "maftuna_rustamova76@digitaledu.uz", 'Student2024!', "maftuna_rustamova", "Maftuna Rustamova",
      "💎", "CS-202", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_076");
  studentNames.push("Maftuna Rustamova");
  if (!existingEmails["murod_aliyev77@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_077", "murod_aliyev77@digitaledu.uz", 'Student2024!', "murod_aliyev", "Murod Aliyev",
      "🌟", "PED-101", 'student', true, 15, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_077");
  studentNames.push("Murod Aliyev");
  if (!existingEmails["zulayho_aliyeva78@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_078", "zulayho_aliyeva78@digitaledu.uz", 'Student2024!', "zulayho_aliyeva", "Zulayho Aliyeva",
      "🎓", "PED-102", 'student', true, 9, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_078");
  studentNames.push("Zulayho Aliyeva");
  if (!existingEmails["anvar_karimov79@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_079", "anvar_karimov79@digitaledu.uz", 'Student2024!', "anvar_karimov", "Anvar Karimov",
      "🎯", "PED-201", 'student', true, 10, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_079");
  studentNames.push("Anvar Karimov");
  if (!existingEmails["hilola_karimova80@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_080", "hilola_karimova80@digitaledu.uz", 'Student2024!', "hilola_karimova", "Hilola Karimova",
      "💡", "PED-202", 'student', true, 11, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_080");
  studentNames.push("Hilola Karimova");
  if (!existingEmails["ilhom_rashidov81@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_081", "ilhom_rashidov81@digitaledu.uz", 'Student2024!', "ilhom_rashidov", "Ilhom Rashidov",
      "⚡", "DI-101", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_081");
  studentNames.push("Ilhom Rashidov");
  if (!existingEmails["kamola_rashidova82@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_082", "kamola_rashidova82@digitaledu.uz", 'Student2024!', "kamola_rashidova", "Kamola Rashidova",
      "🚀", "DI-201", 'student', true, 13, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_082");
  studentNames.push("Kamola Rashidova");
  if (!existingEmails["sherzod_yusupov83@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_083", "sherzod_yusupov83@digitaledu.uz", 'Student2024!', "sherzod_yusupov", "Sherzod Yusupov",
      "⭐", "MAT-101", 'student', true, 14, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_083");
  studentNames.push("Sherzod Yusupov");
  if (!existingEmails["nodira_yusupova84@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_084", "nodira_yusupova84@digitaledu.uz", 'Student2024!', "nodira_yusupova", "Nodira Yusupova",
      "🧠", "INF-201", 'student', true, 15, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_084");
  studentNames.push("Nodira Yusupova");
  if (!existingEmails["mirjalol_nazarov85@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_085", "mirjalol_nazarov85@digitaledu.uz", 'Student2024!', "mirjalol_nazarov", "Mirjalol Nazarov",
      "📚", "CS-101", 'student', true, 9, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_085");
  studentNames.push("Mirjalol Nazarov");
  if (!existingEmails["umida_nazarova86@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_086", "umida_nazarova86@digitaledu.uz", 'Student2024!', "umida_nazarova", "Umida Nazarova",
      "🏆", "CS-102", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_086");
  studentNames.push("Umida Nazarova");
  if (!existingEmails["shohrux_sobirov87@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_087", "shohrux_sobirov87@digitaledu.uz", 'Student2024!', "shohrux_sobirov", "Shohrux Sobirov",
      "💎", "CS-201", 'student', true, 11, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_087");
  studentNames.push("Shohrux Sobirov");
  if (!existingEmails["zarina_sobirova88@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_088", "zarina_sobirova88@digitaledu.uz", 'Student2024!', "zarina_sobirova", "Zarina Sobirova",
      "🌟", "CS-202", 'student', true, 12, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_088");
  studentNames.push("Zarina Sobirova");
  if (!existingEmails["davron_tursunov89@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_089", "davron_tursunov89@digitaledu.uz", 'Student2024!', "davron_tursunov", "Davron Tursunov",
      "🎓", "PED-101", 'student', true, 13, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_089");
  studentNames.push("Davron Tursunov");
  if (!existingEmails["feruza_tursunova90@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_090", "feruza_tursunova90@digitaledu.uz", 'Student2024!', "feruza_tursunova", "Feruza Tursunova",
      "🎯", "PED-102", 'student', true, 14, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_090");
  studentNames.push("Feruza Tursunova");
  if (!existingEmails["muzaffar_ergashev91@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_091", "muzaffar_ergashev91@digitaledu.uz", 'Student2024!', "muzaffar_ergashev", "Muzaffar Ergashev",
      "💡", "PED-201", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_091");
  studentNames.push("Muzaffar Ergashev");
  if (!existingEmails["lola_ergasheva92@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_092", "lola_ergasheva92@digitaledu.uz", 'Student2024!', "lola_ergasheva", "Lola Ergasheva",
      "⚡", "PED-202", 'student', true, 9, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_092");
  studentNames.push("Lola Ergasheva");
  if (!existingEmails["jamshid_rahimov93@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_093", "jamshid_rahimov93@digitaledu.uz", 'Student2024!', "jamshid_rahimov", "Jamshid Rahimov",
      "🚀", "DI-101", 'student', true, 10, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_093");
  studentNames.push("Jamshid Rahimov");
  if (!existingEmails["nargiza_rahimova94@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_094", "nargiza_rahimova94@digitaledu.uz", 'Student2024!', "nargiza_rahimova", "Nargiza Rahimova",
      "⭐", "DI-201", 'student', true, 11, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_094");
  studentNames.push("Nargiza Rahimova");
  if (!existingEmails["aziz_saidov95@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_095", "aziz_saidov95@digitaledu.uz", 'Student2024!', "aziz_saidov", "Aziz Saidov",
      "🧠", "MAT-101", 'student', true, 12, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_095");
  studentNames.push("Aziz Saidov");
  if (!existingEmails["shahnoza_saidova96@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_096", "shahnoza_saidova96@digitaledu.uz", 'Student2024!', "shahnoza_saidova", "Shahnoza Saidova",
      "📚", "INF-201", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_096");
  studentNames.push("Shahnoza Saidova");
  if (!existingEmails["dilshod_ismoilov97@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_097", "dilshod_ismoilov97@digitaledu.uz", 'Student2024!', "dilshod_ismoilov", "Dilshod Ismoilov",
      "🏆", "CS-101", 'student', true, 14, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_097");
  studentNames.push("Dilshod Ismoilov");
  if (!existingEmails["nilufar_ismoilova98@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_098", "nilufar_ismoilova98@digitaledu.uz", 'Student2024!', "nilufar_ismoilova", "Nilufar Ismoilova",
      "💎", "CS-102", 'student', true, 15, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_098");
  studentNames.push("Nilufar Ismoilova");
  if (!existingEmails["farrux_mirzayev99@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_099", "farrux_mirzayev99@digitaledu.uz", 'Student2024!', "farrux_mirzayev", "Farrux Mirzayev",
      "🌟", "CS-201", 'student', true, 9, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_099");
  studentNames.push("Farrux Mirzayev");
  if (!existingEmails["robiya_mirzayeva100@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_100", "robiya_mirzayeva100@digitaledu.uz", 'Student2024!', "robiya_mirzayeva", "Robiya Mirzayeva",
      "🎓", "CS-202", 'student', true, 10, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_100");
  studentNames.push("Robiya Mirzayeva");
  if (!existingEmails["kamron_abdullayev101@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_101", "kamron_abdullayev101@digitaledu.uz", 'Student2024!', "kamron_abdullayev", "Kamron Abdullayev",
      "🎯", "PED-101", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_101");
  studentNames.push("Kamron Abdullayev");
  if (!existingEmails["zilola_abdullayeva102@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_102", "zilola_abdullayeva102@digitaledu.uz", 'Student2024!', "zilola_abdullayeva", "Zilola Abdullayeva",
      "💡", "PED-102", 'student', true, 12, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_102");
  studentNames.push("Zilola Abdullayeva");
  if (!existingEmails["otabek_xolmatov103@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_103", "otabek_xolmatov103@digitaledu.uz", 'Student2024!', "otabek_xolmatov", "Otabek Xolmatov",
      "⚡", "PED-201", 'student', true, 13, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_103");
  studentNames.push("Otabek Xolmatov");
  if (!existingEmails["mohira_xolmatova104@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_104", "mohira_xolmatova104@digitaledu.uz", 'Student2024!', "mohira_xolmatova", "Mohira Xolmatova",
      "🚀", "PED-202", 'student', true, 14, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_104");
  studentNames.push("Mohira Xolmatova");
  if (!existingEmails["temur_qosimov105@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_105", "temur_qosimov105@digitaledu.uz", 'Student2024!', "temur_qosimov", "Temur Qosimov",
      "⭐", "DI-101", 'student', true, 15, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_105");
  studentNames.push("Temur Qosimov");
  if (!existingEmails["gulchehra_qosimova106@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_106", "gulchehra_qosimova106@digitaledu.uz", 'Student2024!', "gulchehra_qosimova", "Gulchehra Qosimova",
      "🧠", "DI-201", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_106");
  studentNames.push("Gulchehra Qosimova");
  if (!existingEmails["zafar_yoldoshev107@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_107", "zafar_yoldoshev107@digitaledu.uz", 'Student2024!', "zafar_yoldoshev", "Zafar Yoldoshev",
      "📚", "MAT-101", 'student', true, 10, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_107");
  studentNames.push("Zafar Yoldoshev");
  if (!existingEmails["shahzoda_yoldosheva108@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_108", "shahzoda_yoldosheva108@digitaledu.uz", 'Student2024!', "shahzoda_yoldosheva", "Shahzoda Yoldosheva",
      "🏆", "INF-201", 'student', true, 11, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_108");
  studentNames.push("Shahzoda Yoldosheva");
  if (!existingEmails["bobur_hasanov109@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_109", "bobur_hasanov109@digitaledu.uz", 'Student2024!', "bobur_hasanov", "Bobur Hasanov",
      "💎", "CS-101", 'student', true, 12, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_109");
  studentNames.push("Bobur Hasanov");
  if (!existingEmails["gozal_hasanova110@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_110", "gozal_hasanova110@digitaledu.uz", 'Student2024!', "gozal_hasanova", "Gozal Hasanova",
      "🌟", "CS-102", 'student', true, 13, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_110");
  studentNames.push("Gozal Hasanova");
  if (!existingEmails["husan_umarov111@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_111", "husan_umarov111@digitaledu.uz", 'Student2024!', "husan_umarov", "Husan Umarov",
      "🎓", "CS-201", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_111");
  studentNames.push("Husan Umarov");
  if (!existingEmails["charos_umarova112@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_112", "charos_umarova112@digitaledu.uz", 'Student2024!', "charos_umarova", "Charos Umarova",
      "🎯", "CS-202", 'student', true, 15, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_112");
  studentNames.push("Charos Umarova");
  if (!existingEmails["javohir_bekmurodov113@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_113", "javohir_bekmurodov113@digitaledu.uz", 'Student2024!', "javohir_bekmurodov", "Javohir Bekmurodov",
      "💡", "PED-101", 'student', true, 9, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_113");
  studentNames.push("Javohir Bekmurodov");
  if (!existingEmails["dilafroz_bekmurodova114@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_114", "dilafroz_bekmurodova114@digitaledu.uz", 'Student2024!', "dilafroz_bekmurodova", "Dilafroz Bekmurodova",
      "⚡", "PED-102", 'student', true, 10, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_114");
  studentNames.push("Dilafroz Bekmurodova");
  if (!existingEmails["oybek_tashpulatov115@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_115", "oybek_tashpulatov115@digitaledu.uz", 'Student2024!', "oybek_tashpulatov", "Oybek Tashpulatov",
      "🚀", "PED-201", 'student', true, 11, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_115");
  studentNames.push("Oybek Tashpulatov");
  if (!existingEmails["laylo_tashpulatova116@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_116", "laylo_tashpulatova116@digitaledu.uz", 'Student2024!', "laylo_tashpulatova", "Laylo Tashpulatova",
      "⭐", "PED-202", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_116");
  studentNames.push("Laylo Tashpulatova");
  if (!existingEmails["shahzod_sharipov117@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_117", "shahzod_sharipov117@digitaledu.uz", 'Student2024!', "shahzod_sharipov", "Shahzod Sharipov",
      "🧠", "DI-101", 'student', true, 13, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_117");
  studentNames.push("Shahzod Sharipov");
  if (!existingEmails["gulnora_sharipova118@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_118", "gulnora_sharipova118@digitaledu.uz", 'Student2024!', "gulnora_sharipova", "Gulnora Sharipova",
      "📚", "DI-201", 'student', true, 14, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_118");
  studentNames.push("Gulnora Sharipova");
  if (!existingEmails["umar_mahmudov119@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_119", "umar_mahmudov119@digitaledu.uz", 'Student2024!', "umar_mahmudov", "Umar Mahmudov",
      "🏆", "MAT-101", 'student', true, 15, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_119");
  studentNames.push("Umar Mahmudov");
  if (!existingEmails["iroda_mahmudova120@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_120", "iroda_mahmudova120@digitaledu.uz", 'Student2024!', "iroda_mahmudova", "Iroda Mahmudova",
      "💎", "INF-201", 'student', true, 9, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_120");
  studentNames.push("Iroda Mahmudova");
  if (!existingEmails["yorqin_olimov121@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_121", "yorqin_olimov121@digitaledu.uz", 'Student2024!', "yorqin_olimov", "Yorqin Olimov",
      "🌟", "CS-101", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_121");
  studentNames.push("Yorqin Olimov");
  if (!existingEmails["madina_olimova122@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_122", "madina_olimova122@digitaledu.uz", 'Student2024!', "madina_olimova", "Madina Olimova",
      "🎓", "CS-102", 'student', true, 11, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_122");
  studentNames.push("Madina Olimova");
  if (!existingEmails["sanjar_tojiyev123@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_123", "sanjar_tojiyev123@digitaledu.uz", 'Student2024!', "sanjar_tojiyev", "Sanjar Tojiyev",
      "🎯", "CS-201", 'student', true, 12, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_123");
  studentNames.push("Sanjar Tojiyev");
  if (!existingEmails["sevara_tojiyeva124@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_124", "sevara_tojiyeva124@digitaledu.uz", 'Student2024!', "sevara_tojiyeva", "Sevara Tojiyeva",
      "💡", "CS-202", 'student', true, 13, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_124");
  studentNames.push("Sevara Tojiyeva");
  if (!existingEmails["nodir_qodirov125@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_125", "nodir_qodirov125@digitaledu.uz", 'Student2024!', "nodir_qodirov", "Nodir Qodirov",
      "⚡", "PED-101", 'student', true, 14, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_125");
  studentNames.push("Nodir Qodirov");
  if (!existingEmails["yulduz_qodirova126@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_126", "yulduz_qodirova126@digitaledu.uz", 'Student2024!', "yulduz_qodirova", "Yulduz Qodirova",
      "🚀", "PED-102", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_126");
  studentNames.push("Yulduz Qodirova");
  if (!existingEmails["shavkat_sultonov127@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_127", "shavkat_sultonov127@digitaledu.uz", 'Student2024!', "shavkat_sultonov", "Shavkat Sultonov",
      "⭐", "PED-201", 'student', true, 9, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_127");
  studentNames.push("Shavkat Sultonov");
  if (!existingEmails["dilnoza_sultonova128@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_128", "dilnoza_sultonova128@digitaledu.uz", 'Student2024!', "dilnoza_sultonova", "Dilnoza Sultonova",
      "🧠", "PED-202", 'student', true, 10, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_128");
  studentNames.push("Dilnoza Sultonova");
  if (!existingEmails["doston_yoqubov129@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_129", "doston_yoqubov129@digitaledu.uz", 'Student2024!', "doston_yoqubov", "Doston Yoqubov",
      "📚", "DI-101", 'student', true, 11, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_129");
  studentNames.push("Doston Yoqubov");
  if (!existingEmails["gulbahor_yoqubova130@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_130", "gulbahor_yoqubova130@digitaledu.uz", 'Student2024!', "gulbahor_yoqubova", "Gulbahor Yoqubova",
      "🏆", "DI-201", 'student', true, 12, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_130");
  studentNames.push("Gulbahor Yoqubova");
  if (!existingEmails["botir_mamatov131@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_131", "botir_mamatov131@digitaledu.uz", 'Student2024!', "botir_mamatov", "Botir Mamatov",
      "💎", "MAT-101", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_131");
  studentNames.push("Botir Mamatov");
  if (!existingEmails["munisa_mamatova132@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_132", "munisa_mamatova132@digitaledu.uz", 'Student2024!', "munisa_mamatova", "Munisa Mamatova",
      "🌟", "INF-201", 'student', true, 14, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_132");
  studentNames.push("Munisa Mamatova");
  if (!existingEmails["asadbek_xudoyberdiyev133@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_133", "asadbek_xudoyberdiyev133@digitaledu.uz", 'Student2024!', "asadbek_xudoyberdiyev", "Asadbek Xudoyberdiyev",
      "🎓", "CS-101", 'student', true, 15, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_133");
  studentNames.push("Asadbek Xudoyberdiyev");
  if (!existingEmails["parvina_xudoyberdiyeva134@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_134", "parvina_xudoyberdiyeva134@digitaledu.uz", 'Student2024!', "parvina_xudoyberdiyeva", "Parvina Xudoyberdiyeva",
      "🎯", "CS-102", 'student', true, 9, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_134");
  studentNames.push("Parvina Xudoyberdiyeva");
  if (!existingEmails["mansurbek_toshmatov135@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_135", "mansurbek_toshmatov135@digitaledu.uz", 'Student2024!', "mansurbek_toshmatov", "Mansurbek Toshmatov",
      "💡", "CS-201", 'student', true, 10, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_135");
  studentNames.push("Mansurbek Toshmatov");
  if (!existingEmails["malika_toshmatova136@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_136", "malika_toshmatova136@digitaledu.uz", 'Student2024!', "malika_toshmatova", "Malika Toshmatova",
      "⚡", "CS-202", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_136");
  studentNames.push("Malika Toshmatova");
  if (!existingEmails["jaloliddin_normurodov137@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_137", "jaloliddin_normurodov137@digitaledu.uz", 'Student2024!', "jaloliddin_normurodov", "Jaloliddin Normurodov",
      "🚀", "PED-101", 'student', true, 12, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_137");
  studentNames.push("Jaloliddin Normurodov");
  if (!existingEmails["ozoda_normurodova138@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_138", "ozoda_normurodova138@digitaledu.uz", 'Student2024!', "ozoda_normurodova", "Ozoda Normurodova",
      "⭐", "PED-102", 'student', true, 13, 15,
      "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z", "2026-09-13T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_138");
  studentNames.push("Ozoda Normurodova");
  if (!existingEmails["ulugbek_berdiyev139@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_139", "ulugbek_berdiyev139@digitaledu.uz", 'Student2024!', "ulugbek_berdiyev", "Ulugbek Berdiyev",
      "🧠", "PED-201", 'student', true, 14, 15,
      "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z", "2026-09-14T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_139");
  studentNames.push("Ulugbek Berdiyev");
  if (!existingEmails["sabina_berdiyeva140@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_140", "sabina_berdiyeva140@digitaledu.uz", 'Student2024!', "sabina_berdiyeva", "Sabina Berdiyeva",
      "📚", "PED-202", 'student', true, 15, 15,
      "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z", "2026-09-15T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_140");
  studentNames.push("Sabina Berdiyeva");
  if (!existingEmails["islom_ganiyev141@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_141", "islom_ganiyev141@digitaledu.uz", 'Student2024!', "islom_ganiyev", "Islom Ganiyev",
      "🏆", "DI-101", 'student', false, 0, 15,
      '', "2026-09-16T10:00:00.000Z", "2026-09-16T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_141");
  studentNames.push("Islom Ganiyev");
  if (!existingEmails["rayhona_ganiyeva142@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_142", "rayhona_ganiyeva142@digitaledu.uz", 'Student2024!', "rayhona_ganiyeva", "Rayhona Ganiyeva",
      "💎", "DI-201", 'student', true, 10, 15,
      "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z", "2026-09-17T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_142");
  studentNames.push("Rayhona Ganiyeva");
  if (!existingEmails["bekzod_bozorov143@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_143", "bekzod_bozorov143@digitaledu.uz", 'Student2024!', "bekzod_bozorov", "Bekzod Bozorov",
      "🌟", "MAT-101", 'student', true, 11, 15,
      "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z", "2026-09-18T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_143");
  studentNames.push("Bekzod Bozorov");
  if (!existingEmails["shaxlo_bozorova144@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_144", "shaxlo_bozorova144@digitaledu.uz", 'Student2024!', "shaxlo_bozorova", "Shaxlo Bozorova",
      "🎓", "INF-201", 'student', true, 12, 15,
      "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z", "2026-09-19T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_144");
  studentNames.push("Shaxlo Bozorova");
  if (!existingEmails["eldor_haydarov145@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_145", "eldor_haydarov145@digitaledu.uz", 'Student2024!', "eldor_haydarov", "Eldor Haydarov",
      "🎯", "CS-101", 'student', true, 13, 15,
      "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z", "2026-09-20T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_145");
  studentNames.push("Eldor Haydarov");
  if (!existingEmails["dildora_haydarova146@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_146", "dildora_haydarova146@digitaledu.uz", 'Student2024!', "dildora_haydarova", "Dildora Haydarova",
      "💡", "CS-102", 'student', false, 0, 15,
      '', "2026-09-21T10:00:00.000Z", "2026-09-21T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_146");
  studentNames.push("Dildora Haydarova");
  if (!existingEmails["jasur_ochilov147@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_147", "jasur_ochilov147@digitaledu.uz", 'Student2024!', "jasur_ochilov", "Jasur Ochilov",
      "⚡", "CS-201", 'student', true, 15, 15,
      "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z", "2026-09-22T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_147");
  studentNames.push("Jasur Ochilov");
  if (!existingEmails["diyora_ochilova148@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_148", "diyora_ochilova148@digitaledu.uz", 'Student2024!', "diyora_ochilova", "Diyora Ochilova",
      "🚀", "CS-202", 'student', true, 9, 15,
      "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z", "2026-09-23T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_148");
  studentNames.push("Diyora Ochilova");
  if (!existingEmails["laziz_boboyev149@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_149", "laziz_boboyev149@digitaledu.uz", 'Student2024!', "laziz_boboyev", "Laziz Boboyev",
      "⭐", "PED-101", 'student', true, 10, 15,
      "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z", "2026-09-24T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_149");
  studentNames.push("Laziz Boboyev");
  if (!existingEmails["sarvinoz_boboyeva150@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_150", "sarvinoz_boboyeva150@digitaledu.uz", 'Student2024!', "sarvinoz_boboyeva", "Sarvinoz Boboyeva",
      "🧠", "PED-102", 'student', true, 11, 15,
      "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z", "2026-09-25T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_150");
  studentNames.push("Sarvinoz Boboyeva");
  if (!existingEmails["rustam_rustamov151@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_151", "rustam_rustamov151@digitaledu.uz", 'Student2024!', "rustam_rustamov", "Rustam Rustamov",
      "📚", "PED-201", 'student', false, 0, 15,
      '', "2026-09-01T10:00:00.000Z", "2026-09-01T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_151");
  studentNames.push("Rustam Rustamov");
  if (!existingEmails["barno_rustamova152@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_152", "barno_rustamova152@digitaledu.uz", 'Student2024!', "barno_rustamova", "Barno Rustamova",
      "🏆", "PED-202", 'student', true, 13, 15,
      "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z", "2026-09-02T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_152");
  studentNames.push("Barno Rustamova");
  if (!existingEmails["xurshid_aliyev153@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_153", "xurshid_aliyev153@digitaledu.uz", 'Student2024!', "xurshid_aliyev", "Xurshid Aliyev",
      "💎", "DI-101", 'student', true, 14, 15,
      "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z", "2026-09-03T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_153");
  studentNames.push("Xurshid Aliyev");
  if (!existingEmails["maftuna_aliyeva154@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_154", "maftuna_aliyeva154@digitaledu.uz", 'Student2024!', "maftuna_aliyeva", "Maftuna Aliyeva",
      "🌟", "DI-201", 'student', true, 15, 15,
      "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z", "2026-09-04T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_154");
  studentNames.push("Maftuna Aliyeva");
  if (!existingEmails["akmal_karimov155@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_155", "akmal_karimov155@digitaledu.uz", 'Student2024!', "akmal_karimov", "Akmal Karimov",
      "🎓", "MAT-101", 'student', true, 9, 15,
      "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z", "2026-09-05T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_155");
  studentNames.push("Akmal Karimov");
  if (!existingEmails["zulayho_karimova156@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_156", "zulayho_karimova156@digitaledu.uz", 'Student2024!', "zulayho_karimova", "Zulayho Karimova",
      "🎯", "INF-201", 'student', false, 0, 15,
      '', "2026-09-06T10:00:00.000Z", "2026-09-06T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_156");
  studentNames.push("Zulayho Karimova");
  if (!existingEmails["elyor_rashidov157@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_157", "elyor_rashidov157@digitaledu.uz", 'Student2024!', "elyor_rashidov", "Elyor Rashidov",
      "💡", "CS-101", 'student', true, 11, 15,
      "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z", "2026-09-07T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_157");
  studentNames.push("Elyor Rashidov");
  if (!existingEmails["hilola_rashidova158@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_158", "hilola_rashidova158@digitaledu.uz", 'Student2024!', "hilola_rashidova", "Hilola Rashidova",
      "⚡", "CS-102", 'student', true, 12, 15,
      "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z", "2026-09-08T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_158");
  studentNames.push("Hilola Rashidova");
  if (!existingEmails["ikrom_yusupov159@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_159", "ikrom_yusupov159@digitaledu.uz", 'Student2024!', "ikrom_yusupov", "Ikrom Yusupov",
      "🚀", "CS-201", 'student', true, 13, 15,
      "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z", "2026-09-09T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_159");
  studentNames.push("Ikrom Yusupov");
  if (!existingEmails["kamola_yusupova160@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_160", "kamola_yusupova160@digitaledu.uz", 'Student2024!', "kamola_yusupova", "Kamola Yusupova",
      "⭐", "CS-202", 'student', true, 14, 15,
      "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z", "2026-09-10T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_160");
  studentNames.push("Kamola Yusupova");
  if (!existingEmails["komil_nazarov161@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_161", "komil_nazarov161@digitaledu.uz", 'Student2024!', "komil_nazarov", "Komil Nazarov",
      "🧠", "PED-101", 'student', false, 0, 15,
      '', "2026-09-11T10:00:00.000Z", "2026-09-11T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_161");
  studentNames.push("Komil Nazarov");
  if (!existingEmails["nodira_nazarova162@digitaledu.uz"]) {
    newStudentRows.push([
      "usr_std_162", "nodira_nazarova162@digitaledu.uz", 'Student2024!', "nodira_nazarova", "Nodira Nazarova",
      "📚", "PED-102", 'student', true, 9, 15,
      "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z", "2026-09-12T10:00:00.000Z"
    ]);
  }
  studentIds.push("usr_std_162");
  studentNames.push("Nodira Nazarova");
  if (newStudentRows.length > 0) {
    profSheet.getRange(profSheet.getLastRow() + 1, 1, newStudentRows.length, newStudentRows[0].length).setValues(newStudentRows);
  }

  // 2. SEED CONTENT ITEMS (10 ta amaliyot)
  var contSheet = ss.getSheetByName('content_items');
  if (contSheet.getLastRow() <= 1) {
    var contentRows = [
      ["item_prac_1", 'practice', "Amaliyot 1: Pedagogik texnologiyalar dars ishlanmasi (Lesson Plan)", "Interaktiv metodlar asosida zamonaviy 45 daqiqalik dars ishlanmasini loyihalash", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 1, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_2", 'practice', "Amaliyot 2: Binar dars modeli va keys-stadi loyihasi", "Fanlararo integratsiya va muammoli ta'lim keysini ishlab chiqish", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 2, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_3", 'practice', "Amaliyot 3: Blum taksonomiyasi bo'yicha topshiriqlar tizimi", "Bilishdan baholashgacha bo'lgan 6 bosqichli topshiriqlar yaratish", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 3, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_4", 'practice', "Amaliyot 4: Baholash mezonlari (Rubrics) ishlab chiqish", "Formativ va summativ baholash uchun deskriptorli rubrikalar tuzish", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 4, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_5", 'practice', "Amaliyot 5: Raqamli ta'lim vositalari (Kahoot, Padlet) integratsiyasi", "Dars samaradorligini oshiruvchi raqamli platformalar amaliyoti", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 5, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_6", 'practice', "Amaliyot 6: Pedagogik nizolarni tahlil qilish va hal etish", "O'qituvchi-o'quvchi o'rtasidagi nizoli vaziyatlarni konstruktiv yechish", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 6, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_7", 'practice', "Amaliyot 7: STEAM yondashuvi asosida fanlararo mashg'ulot", "Tabiiy fanlar va texnologiyalarni uyg'unlashtiruvchi loyiha ishi", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 7, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_8", 'practice', "Amaliyot 8: Inklyuziv ta'limda individual ta'lim traektoriyasi", "Maxsus ehtiyojli o'quvchilar uchun moslashtirilgan o'quv dasturi", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 8, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_9", 'practice', "Amaliyot 9: Masofaviy dars uchun interaktiv taqdimot va video", "Scorm yoki interaktiv slaydlar orqali mustaqil ta'lim materialini yaratish", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 9, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
      ["item_prac_10", 'practice', "Amaliyot 10: O'quvchilarda tanqidiy fikrlashni rivojlantirish", "Fakt va fikrni ajratish, mantiqiy xulosalar chiqarish mashqlari", 'Ushbu amaliy topshiriqni talablar asosida tayyorlab, PDF yoki Word formatida yuklang. Baholash mezoni: 100 ball.', 10, '[]', '{"maxScore":100}', 'approved', 'teacher-default-id', '2026-09-05T09:00:00.000Z', '2026-09-05T09:00:00.000Z'],
    ];
    contSheet.getRange(contSheet.getLastRow() + 1, 1, contentRows.length, contentRows[0].length).setValues(contentRows);
  }

  // 3. SEED SUBMISSIONS (Topshiriqlar)
  var subSheet = ss.getSheetByName('submissions');
  if (subSheet.getLastRow() <= 1) {
    var subRows = [];
    subRows.push([
      "sub_1", "usr_std_001", "item_prac_1", "Dars_ishlanmasi_Pedagogika.pdf", 245000, '',
      "graded", 82, "Mavzu to'liq ochib berilgan, metodik yondashuv juda yaxshi tanlangan. A'lo!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-01T11:00:00.000Z", "2026-10-01T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_2", "usr_std_002", "item_prac_2", "Keys_stadi_tahlil.docx", 245000, '',
      "graded", 83, "Dars ishlanmasida vaqt taqsimoti aniq ko'rsatilgan. Interaktiv metodlar muvaffaqiyatli qo'llangan.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-02T11:00:00.000Z", "2026-10-02T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_3", "usr_std_003", "item_prac_3", "Blum_taksonomiyasi_jadval.pdf", 245000, '',
      "graded", 84, "Blum taksonomiyasi darajalari to'g'ri taqsimlangan. Baholash mezoni aniq.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-03T11:00:00.000Z", "2026-10-03T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_4", "usr_std_004", "item_prac_4", "Baholash_rubriklari_shablon.xlsx", 245000, '',
      "graded", 85, "Keys tahlili chuqur va mustaqil fikrlarga boy. Barakalla!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-04T11:00:00.000Z", "2026-10-04T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_5", "usr_std_005", "item_prac_5", "STEAM_loyiha_ishlanmasi.pdf", 245000, '',
      "graded", 86, "Taqdimot dizayni didaktik talablarga to'liq javob beradi. 95 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-05T11:00:00.000Z", "2026-10-05T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_6", "usr_std_006", "item_prac_6", "Raqamli_vositalar_dars_rejasi.pdf", 245000, '',
      "graded", 87, "Baholash rubriklari puxta ishlab chiqilgan. Amaliyotda bemalol foydalanish mumkin.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-06T11:00:00.000Z", "2026-10-06T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_7", "usr_std_007", "item_prac_7", "Inklyuziv_talim_rejasi.docx", 245000, '',
      "graded", 88, "Tahliliy qism yaxshi, lekin xulosa qismini biroz kengaytirish tavsiya etiladi. 88 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-07T11:00:00.000Z", "2026-10-07T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_8", "usr_std_008", "item_prac_8", "Konfliktlar_yechimi_keys.pdf", 245000, '',
      "graded", 89, "Topshiriq mezonlarga to'liq mos, ijodiy yondashuv sezilib turibdi.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-08T11:00:00.000Z", "2026-10-08T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_9", "usr_std_009", "item_prac_9", "Taqdimot_Interaktiv_metodlar.pptx", 245000, '',
      "graded", 90, "Mavzu to'liq ochib berilgan, metodik yondashuv juda yaxshi tanlangan. A'lo!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-01T11:00:00.000Z", "2026-10-01T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_10", "usr_std_010", "item_prac_10", "Dars_ishlanmasi_Pedagogika.pdf", 245000, '',
      "graded", 91, "Dars ishlanmasida vaqt taqsimoti aniq ko'rsatilgan. Interaktiv metodlar muvaffaqiyatli qo'llangan.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-02T11:00:00.000Z", "2026-10-02T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_11", "usr_std_011", "item_prac_1", "Keys_stadi_tahlil.docx", 245000, '',
      "graded", 92, "Blum taksonomiyasi darajalari to'g'ri taqsimlangan. Baholash mezoni aniq.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-03T11:00:00.000Z", "2026-10-03T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_12", "usr_std_012", "item_prac_2", "Blum_taksonomiyasi_jadval.pdf", 245000, '',
      "graded", 93, "Keys tahlili chuqur va mustaqil fikrlarga boy. Barakalla!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-04T11:00:00.000Z", "2026-10-04T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_13", "usr_std_013", "item_prac_3", "Baholash_rubriklari_shablon.xlsx", 245000, '',
      "graded", 94, "Taqdimot dizayni didaktik talablarga to'liq javob beradi. 95 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-05T11:00:00.000Z", "2026-10-05T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_14", "usr_std_014", "item_prac_4", "STEAM_loyiha_ishlanmasi.pdf", 245000, '',
      "graded", 95, "Baholash rubriklari puxta ishlab chiqilgan. Amaliyotda bemalol foydalanish mumkin.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-06T11:00:00.000Z", "2026-10-06T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_15", "usr_std_015", "item_prac_5", "Raqamli_vositalar_dars_rejasi.pdf", 245000, '',
      "graded", 96, "Tahliliy qism yaxshi, lekin xulosa qismini biroz kengaytirish tavsiya etiladi. 88 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-07T11:00:00.000Z", "2026-10-07T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_16", "usr_std_016", "item_prac_6", "Inklyuziv_talim_rejasi.docx", 245000, '',
      "graded", 97, "Topshiriq mezonlarga to'liq mos, ijodiy yondashuv sezilib turibdi.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-08T11:00:00.000Z", "2026-10-08T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_17", "usr_std_017", "item_prac_7", "Konfliktlar_yechimi_keys.pdf", 245000, '',
      "graded", 98, "Mavzu to'liq ochib berilgan, metodik yondashuv juda yaxshi tanlangan. A'lo!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-01T11:00:00.000Z", "2026-10-01T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_18", "usr_std_018", "item_prac_8", "Taqdimot_Interaktiv_metodlar.pptx", 245000, '',
      "graded", 99, "Dars ishlanmasida vaqt taqsimoti aniq ko'rsatilgan. Interaktiv metodlar muvaffaqiyatli qo'llangan.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-02T11:00:00.000Z", "2026-10-02T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_19", "usr_std_019", "item_prac_9", "Dars_ishlanmasi_Pedagogika.pdf", 245000, '',
      "graded", 82, "Blum taksonomiyasi darajalari to'g'ri taqsimlangan. Baholash mezoni aniq.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-03T11:00:00.000Z", "2026-10-03T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_20", "usr_std_020", "item_prac_10", "Keys_stadi_tahlil.docx", 245000, '',
      "graded", 83, "Keys tahlili chuqur va mustaqil fikrlarga boy. Barakalla!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-04T11:00:00.000Z", "2026-10-04T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_21", "usr_std_021", "item_prac_1", "Blum_taksonomiyasi_jadval.pdf", 245000, '',
      "graded", 84, "Taqdimot dizayni didaktik talablarga to'liq javob beradi. 95 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-05T11:00:00.000Z", "2026-10-05T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_22", "usr_std_022", "item_prac_2", "Baholash_rubriklari_shablon.xlsx", 245000, '',
      "graded", 85, "Baholash rubriklari puxta ishlab chiqilgan. Amaliyotda bemalol foydalanish mumkin.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-06T11:00:00.000Z", "2026-10-06T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_23", "usr_std_023", "item_prac_3", "STEAM_loyiha_ishlanmasi.pdf", 245000, '',
      "graded", 86, "Tahliliy qism yaxshi, lekin xulosa qismini biroz kengaytirish tavsiya etiladi. 88 ball.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-07T11:00:00.000Z", "2026-10-07T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_24", "usr_std_024", "item_prac_4", "Raqamli_vositalar_dars_rejasi.pdf", 245000, '',
      "graded", 87, "Topshiriq mezonlarga to'liq mos, ijodiy yondashuv sezilib turibdi.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-08T11:00:00.000Z", "2026-10-08T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_25", "usr_std_025", "item_prac_5", "Inklyuziv_talim_rejasi.docx", 245000, '',
      "graded", 88, "Mavzu to'liq ochib berilgan, metodik yondashuv juda yaxshi tanlangan. A'lo!", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-01T11:00:00.000Z", "2026-10-01T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_26", "usr_std_026", "item_prac_6", "Konfliktlar_yechimi_keys.pdf", 245000, '',
      "graded", 89, "Dars ishlanmasida vaqt taqsimoti aniq ko'rsatilgan. Interaktiv metodlar muvaffaqiyatli qo'llangan.", "teacher-default-id", "2026-10-08T14:30:00.000Z",
      "2026-10-02T11:00:00.000Z", "2026-10-02T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_27", "usr_std_027", "item_prac_7", "Taqdimot_Interaktiv_metodlar.pptx", 245000, '',
      "pending", '', "", "", "",
      "2026-10-03T11:00:00.000Z", "2026-10-03T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_28", "usr_std_028", "item_prac_8", "Dars_ishlanmasi_Pedagogika.pdf", 245000, '',
      "pending", '', "", "", "",
      "2026-10-04T11:00:00.000Z", "2026-10-04T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_29", "usr_std_029", "item_prac_9", "Keys_stadi_tahlil.docx", 245000, '',
      "pending", '', "", "", "",
      "2026-10-05T11:00:00.000Z", "2026-10-05T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_30", "usr_std_030", "item_prac_10", "Blum_taksonomiyasi_jadval.pdf", 245000, '',
      "pending", '', "", "", "",
      "2026-10-06T11:00:00.000Z", "2026-10-06T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_31", "usr_std_001", "item_prac_1", "Baholash_rubriklari_shablon.xlsx", 245000, '',
      "pending", '', "", "", "",
      "2026-10-07T11:00:00.000Z", "2026-10-07T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_32", "usr_std_002", "item_prac_2", "STEAM_loyiha_ishlanmasi.pdf", 245000, '',
      "pending", '', "", "", "",
      "2026-10-08T11:00:00.000Z", "2026-10-08T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_33", "usr_std_003", "item_prac_3", "Raqamli_vositalar_dars_rejasi.pdf", 245000, '',
      "pending", '', "", "", "",
      "2026-10-01T11:00:00.000Z", "2026-10-01T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_34", "usr_std_004", "item_prac_4", "Inklyuziv_talim_rejasi.docx", 245000, '',
      "pending", '', "", "", "",
      "2026-10-02T11:00:00.000Z", "2026-10-02T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_35", "usr_std_005", "item_prac_5", "Konfliktlar_yechimi_keys.pdf", 245000, '',
      "pending", '', "", "", "",
      "2026-10-03T11:00:00.000Z", "2026-10-03T11:00:00.000Z"
    ]);
    subRows.push([
      "sub_36", "usr_std_006", "item_prac_6", "Taqdimot_Interaktiv_metodlar.pptx", 245000, '',
      "pending", '', "", "", "",
      "2026-10-04T11:00:00.000Z", "2026-10-04T11:00:00.000Z"
    ]);
    subSheet.getRange(subSheet.getLastRow() + 1, 1, subRows.length, subRows[0].length).setValues(subRows);
  }

  // 4. SEED ROLE REQUESTS (Rol so'rovlari)
  var roleSheet = ss.getSheetByName('role_requests');
  if (roleSheet.getLastRow() <= 1) {
    var roleRows = [
      ['req_1', 'usr_std_001', 'pending', '', '', '2026-10-11T09:00:00.000Z', '2026-10-11T09:00:00.000Z'],
      ['req_2', 'usr_std_003', 'pending', '', '', '2026-10-12T11:30:00.000Z', '2026-10-12T11:30:00.000Z'],
      ['req_3', 'usr_std_005', 'approved', 'admin-default-id', '2026-10-13T15:00:00.000Z', '2026-10-10T08:00:00.000Z', '2026-10-13T15:00:00.000Z'],
      ['req_4', 'usr_std_007', 'rejected', 'admin-default-id', '2026-10-13T16:00:00.000Z', '2026-10-09T14:00:00.000Z', '2026-10-13T16:00:00.000Z'],
      ['req_5', 'usr_std_009', 'pending', '', '', '2026-10-14T08:20:00.000Z', '2026-10-14T08:20:00.000Z']
    ];
    roleSheet.getRange(roleSheet.getLastRow() + 1, 1, roleRows.length, roleRows[0].length).setValues(roleRows);
  }

  // 5. SEED QUIZ & PRACTICE RESULTS
  var qSheet = ss.getSheetByName('quiz_results');
  var prSheet = ss.getSheetByName('practice_results');
  if (qSheet.getLastRow() <= 1) {
    var qRows = [];
    var prRows = [];
    for (var qi = 0; qi < 100; qi++) {
      var qStd = 'usr_std_' + String((qi % 50) + 1).padStart(3, '0');
      var qTopic = (qi % 10) + 1;
      var qScore = 4 + (qi % 2);
      var qDate = '2026-10-0' + ((qi % 9) + 1) + 'T12:00:00.000Z';
      qRows.push([
        'qz_' + qi, qStd, qTopic, '', 1, qScore, 5, qScore * 20, qScore * 5, qDate
      ]);
      if (qi < 70) {
        var prScore = 80 + (qi % 21);
        prRows.push([
          'pr_' + qi, qStd, qTopic, 'item_prac_' + qTopic, prScore, 100, Math.round(prScore * 0.5), qDate
        ]);
      }
    }
    qSheet.getRange(qSheet.getLastRow() + 1, 1, qRows.length, qRows[0].length).setValues(qRows);
    prSheet.getRange(prSheet.getLastRow() + 1, 1, prRows.length, prRows[0].length).setValues(prRows);
  }

  return {
    success: true,
    message: 'DigitalEdu bazasi 160 dan ortiq talabalar, amaliyotlar va natijalar bilan muvaffaqiyatli boyitildi!',
    stats: {
      totalStudents: profSheet.getLastRow() - 1,
      totalContent: contSheet.getLastRow() - 1,
      totalSubmissions: subSheet.getLastRow() - 1,
      totalRoleRequests: roleSheet.getLastRow() - 1,
      totalQuizzes: qSheet.getLastRow() - 1,
      totalPractices: prSheet.getLastRow() - 1
    }
  };
}
