/**
 * Backend do Sistema de Agendamento — Clínica-Escola UNASP
 *
 * Como usar:
 * 1. Crie uma planilha no Google Drive.
 * 2. Em Extensões → Apps Script, cole este arquivo inteiro.
 * 3. Salve e clique em Implantar → Nova implantação.
 *    Tipo: App da Web. Executar como: Eu. Quem pode acessar: Qualquer pessoa.
 * 4. Copie a URL e cole na tela /setup do app.
 *
 * Usuário inicial: admin / admin (criado automaticamente).
 */

const SHEETS = {
  usuarios: ["id","username","passwordHash","nome","role"],
  pacientes: ["id","primeiroNome","sobrenome","telefone","email","menorIdade","respPrimeiroNome","respSobrenome"],
  alunos: ["id","nomeCompleto","telefone","semestre"],
  orientadores: ["id","nome"],
  sessoes: ["id","sala","alunoId","pacienteId","data","diaSemana","horaInicio","horaFim","status"],
  materiais: ["id","alunoId","sala","data","hora","material"],
};

// SHA-256 hex de "admin"
const ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets_() {
  const ss = ss_();
  Object.keys(SHEETS).forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sh.setFrozenRows(1);
    }
  });
  // seed admin
  var u = ss.getSheetByName("usuarios");
  if (u.getLastRow() < 2) {
    u.appendRow([Utilities.getUuid(), "admin", ADMIN_HASH, "Administrador", "admin"]);
  }
}

function readAll_(name) {
  var sh = ss_().getSheetByName(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var o = {};
    headers.forEach(function(h, i) {
      var v = row[i];
      if (h === "menorIdade") v = v === true || v === "TRUE" || v === "true" || v === 1;
      o[h] = v;
    });
    return o;
  }).filter(function(o) { return o.id; });
}

function findRow_(name, id) {
  var sh = ss_().getSheetByName(name);
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) if (values[i][0] === id) return { sh: sh, row: i + 1, headers: values[0] };
  return null;
}

function rowFromObj_(headers, obj) {
  return headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ""; });
}

function ok_(data) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data: data })).setMimeType(ContentService.MimeType.JSON);
}
function err_(message) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(message) })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    ensureSheets_();
    var body = JSON.parse(e.postData.contents || "{}");
    return route_(body);
  } catch (ex) { return err_(ex.message || ex); }
}
function doGet(e) {
  try {
    ensureSheets_();
    return ok_({ status: "ok", message: "UNASP API ativa" });
  } catch (ex) { return err_(ex.message || ex); }
}

function route_(body) {
  var action = body.action;
  if (action === "login") return login_(body);
  if (action === "list") return ok_(readAll_(body.entity));
  if (action === "create") return create_(body.entity, body.data);
  if (action === "update") return update_(body.entity, body.data);
  if (action === "delete") return delete_(body.entity, body.id);
  return err_("Ação desconhecida: " + action);
}

function login_(body) {
  var users = readAll_("usuarios");
  var u = users.filter(function(x) { return x.username === body.username; })[0];
  if (!u || u.passwordHash !== body.passwordHash) return err_("Usuário ou senha inválidos");
  return ok_({ id: u.id, username: u.username, nome: u.nome, role: u.role });
}

function create_(entity, data) {
  if (!SHEETS[entity]) return err_("Entidade inválida");
  var sh = ss_().getSheetByName(entity);
  var headers = SHEETS[entity];
  var obj = Object.assign({}, data, { id: Utilities.getUuid() });
  if (entity === "sessoes") {
    var conflict = checkSessionConflict_(obj, null);
    if (conflict) return err_(conflict);
  }
  sh.appendRow(rowFromObj_(headers, obj));
  return ok_(obj);
}

function update_(entity, data) {
  if (!SHEETS[entity]) return err_("Entidade inválida");
  var found = findRow_(entity, data.id);
  if (!found) return err_("Não encontrado");
  if (entity === "sessoes") {
    var conflict = checkSessionConflict_(data, data.id);
    if (conflict) return err_(conflict);
  }
  found.sh.getRange(found.row, 1, 1, found.headers.length).setValues([rowFromObj_(found.headers, data)]);
  return ok_(data);
}

function delete_(entity, id) {
  if (!SHEETS[entity]) return err_("Entidade inválida");
  var found = findRow_(entity, id);
  if (!found) return err_("Não encontrado");
  found.sh.deleteRow(found.row);
  return ok_({ id: id });
}

function checkSessionConflict_(s, ignoreId) {
  var all = readAll_("sessoes");
  for (var i = 0; i < all.length; i++) {
    var x = all[i];
    if (x.id === ignoreId || x.status === "cancelada") continue;
    if (x.data === s.data && x.horaInicio === s.horaInicio) {
      if (x.sala === s.sala) return "Conflito: sala já ocupada nesse horário";
      if (x.alunoId === s.alunoId) return "Conflito: aluno já tem sessão nesse horário";
    }
  }
  return null;
}