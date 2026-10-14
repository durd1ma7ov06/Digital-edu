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
