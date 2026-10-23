import { prisma } from '../lib/prisma';
import { authenticate, staff, master, need, text, failure, academyScope } from '../lib/portal-http';
import { hashPassword } from '../lib/portal-auth';
import { randomUUID } from 'node:crypto';
import { monthWindow } from '../lib/portal-learning';

const memberFields = { id: true, username: true, name: true, role: true, status: true, grade: true, school: true, gender: true, phone: true,
  parentName: true, parentPhone: true, parentEmail: true, reportYn: true, classGroupId: true, points: true, bookCount: true, quizAvg: true, updatedAt: true } as const;
function enumValue(value: any, values: string[], label: string) { need(values.includes(value), label + ' 값을 확인해 주세요.'); return value; }
function date(value: any, label: string) { const result = new Date(value); need(Number.isFinite(+result), label + ' 날짜를 입력해 주세요.'); return result; }
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await authenticate(req); staff(user);
    const entity = String(req.query.entity || 'members');
    // 학원 자체의 생성·수정은 아직 존재하지 않는 코드도 받을 수 있으므로 세션 학원을 기준으로 권한만 확인합니다.
    const academyId = entity === 'academies' ? user.academyId : await academyScope(user, req.query.academy);
    const body = req.body || {}; const input = body.data || {};
    if (req.method === 'POST') {
      need(['save','delete','import','restore'].includes(body.operation), '요청 작업을 확인해 주세요.');
      if (body.operation === 'restore') need(entity === 'academies', '복구할 수 없는 항목입니다.');
      if (body.operation === 'delete' || body.operation === 'restore') need(typeof input.id === 'string' && input.id.length > 0, '대상 항목을 선택해 주세요.');
    }
    if (req.method === 'GET') {
      if (entity === 'rankings') {
        const totals = await prisma.pointHistory.groupBy({ by: ['memberId'], where: { createdAt: monthWindow(String(req.query.period)), member: { academyId, role: 'STUDENT', status: 'APPROVED' } }, _sum: { amount: true } });
        totals.sort((a,b) => (b._sum.amount || 0) - (a._sum.amount || 0) || a.memberId.localeCompare(b.memberId));
        const members = await prisma.member.findMany({ where: { id: { in: totals.map(t => t.memberId) } }, select: { id: true, name: true, username: true } });
        return res.json({ items: totals.map((t,index) => ({ id: t.memberId, rank: index + 1, name: members.find(m => m.id === t.memberId)?.name || '', username: members.find(m => m.id === t.memberId)?.username, points: t._sum.amount || 0 })) });
      }
      if (entity === 'members') return res.json({ items: await prisma.member.findMany({ where: { academyId }, select: memberFields, orderBy: { name: 'asc' } }) });
      if (entity === 'classes') return res.json({ items: await prisma.classGroup.findMany({ where: { academyId }, orderBy: { name: 'asc' } }) });
      if (entity === 'academies') { master(user); return res.json({ items: await prisma.academy.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }) }); }
      if (entity === 'books') return res.json({ items: await prisma.book.findMany({ orderBy: { bookNo: 'asc' }, take: 1000, where: req.query.search ? { title: { contains: String(req.query.search), mode: 'insensitive' } } : {} }) });
      if (entity === 'owned') return res.json({ items: await prisma.academyBook.findMany({ where: { academyId }, include: { book: { select: { bookNo: true, title: true } } } }) });
      if (entity === 'assignments') return res.json({ items: await prisma.bookAssignment.findMany({ where: { academyId }, include: { book: { select: { title: true, bookNo: true } }, member: { select: { name: true, username: true } } }, orderBy: { createdAt: 'desc' } }) });
      if (entity === 'payments') return res.json({ items: await prisma.payment.findMany({ where: { academyId }, orderBy: { createdAt: 'desc' } }) });
      if (entity === 'notices') return res.json({ items: await prisma.notice.findMany({ orderBy: { createdAt: 'desc' } }) });
      if (entity === 'themes') return res.json({ items: await prisma.themeCategory.findMany({ orderBy: { name: 'asc' } }) });
      if (entity === 'banners') return res.json({ items: await prisma.mainBanner.findMany({ orderBy: { orderNo: 'asc' } }) });
      if (entity === 'quizzes') { need(req.query.bookId, '도서를 선택해 주세요.'); return res.json({ items: await prisma.bookQuiz.findMany({ where: { bookId: String(req.query.bookId) }, orderBy: { questionNo: 'asc' } }) }); }
      if (entity === 'dispatch') return res.json({ items: await prisma.aligoDispatchLog.findMany({ where: { academyId }, orderBy: { sentAt: 'desc' }, take: 200 }) });
      if (entity === 'portfolios') return res.json({ items: (await prisma.portalSetting.findMany({ where: { scope: 'portfolio:' + academyId }, orderBy: { updatedAt: 'desc' } })).map(p => ({ ...(p.value as any), id: p.key, revision: p.revision })) });
      throw new Error('Unknown collection');
    }
    need(JSON.stringify(body).length < 500000, '한 번에 등록할 수 있는 데이터 크기를 초과했습니다.', 413);
    if (entity === 'portfolios') {
      const scope = 'portfolio:' + academyId;
      if (body.operation === 'delete') { await prisma.portalSetting.deleteMany({ where: { key: input.id, scope } }); return res.json({ ok: true }); }
      const student = await prisma.member.findFirst({ where: { id: input.memberId, academyId, role: 'STUDENT' } }); need(student, '소속 학생을 선택해 주세요.');
      const from = date(input.from, '시작'), to = date(input.to, '종료'); need(to >= from, '기간을 확인해 주세요.');
      const logs = await prisma.quizAttempt.findMany({ where: { memberId: student.id, completedAt: { gte: from, lt: new Date(+to + 86400000) } }, orderBy: { completedAt: 'asc' } });
      const books = await prisma.book.findMany({ where: { id: { in: logs.map(l => l.bookId) } }, select: { id: true, title: true } });
      const value = { memberId: student.id, name: student.name, from: input.from, to: input.to, comment: text(input.comment, '총평', 20000),
        books: logs.map(l => ({ bookId: l.bookId, title: books.find(b => b.id === l.bookId)?.title || '삭제된 도서', date: l.completedAt.toISOString().slice(0,10), score: l.score, thought: l.thinkReply || '' })),
        title: student.name + ' 독서 포트폴리오', createdAt: new Date().toISOString() };
      if (input.id) {
        const saved = await prisma.portalSetting.updateMany({ where: { key: input.id, scope, revision: Number(input.revision) }, data: { value, revision: { increment: 1 } } });
        need(saved.count === 1, '다른 선생님이 수정했습니다. 새로고침 후 다시 저장해 주세요.', 409);
      } else await prisma.portalSetting.create({ data: { key: 'pf_' + randomUUID(), scope, value } });
      return res.json({ ok: true });
    }
    if (entity === 'owned') {
      if (body.operation === 'delete') { await prisma.academyBook.deleteMany({ where: { id: input.id, academyId } }); return res.json({ ok: true }); }
      need(await prisma.book.findUnique({ where: { id: input.bookId } }), '도서를 선택해 주세요.');
      return res.json({ item: await prisma.academyBook.upsert({ where: { academyId_bookId: { academyId, bookId: input.bookId } }, create: { academyId, bookId: input.bookId }, update: {} }) });
    }
    if (entity === 'members') {
      need(user.role === 'DIRECTOR' || user.role === 'MASTER', '회원 변경은 원장 또는 본사 관리자만 가능합니다.', 403);
      const rows = body.operation === 'import' ? body.rows : [input];
      need(Array.isArray(rows) && rows.length > 0 && rows.length <= 200, '회원은 한 번에 1~200명까지 등록할 수 있습니다.');
      const items = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM academies WHERE id = ${academyId} FOR UPDATE`;
        const saved = [];
        for (const row of rows) {
          const existing = row.id ? await tx.member.findFirst({ where: { id: String(row.id), academyId } }) : null;
          need(!row.id || existing, '해당 학원의 회원을 찾을 수 없습니다.', 404);
          need(existing?.role !== 'MASTER', '본사 계정 변경은 계정 설정에서 진행해 주세요.', 403);
          need(existing?.id !== user.id || body.operation !== 'delete', '본인 계정은 삭제할 수 없습니다.');
          if (body.operation === 'delete') { need(user.role === 'MASTER' || existing!.role !== 'DIRECTOR', '원장 계정은 본사에서 관리합니다.', 403); saved.push(await tx.member.update({ where: { id: existing!.id }, data: { status: 'WITHDRAWN' }, select: memberFields })); continue; }
          const role = enumValue(row.role || 'STUDENT', ['STUDENT','TEACHER','DIRECTOR'], '권한') as any;
          if (user.role !== 'MASTER') need(role !== 'DIRECTOR' && existing?.role !== 'DIRECTOR', '원장·본사 계정은 본사에서 관리합니다.', 403);
          const username = text(row.username || existing?.username, '아이디', 50, true);
          need(/^[\w-]{3,50}$/.test(username), '아이디는 영문·숫자·밑줄·하이픈 3~50자로 입력해 주세요.');
          const classGroupId = row.classGroupId || null;
          if (classGroupId) need(await tx.classGroup.findFirst({ where: { id: classGroupId, academyId } }), '다른 학원의 학급을 선택할 수 없습니다.');
          const data: any = { academyId, username, role, name: text(row.name, '이름', 100, true), classGroupId,
            status: enumValue(row.status || 'PENDING', ['APPROVED','PENDING','SUSPENDED','WITHDRAWN'], '승인 상태'),
            grade: text(row.grade, '학년'), school: text(row.school, '학교'), gender: text(row.gender, '성별'), phone: text(row.phone, '연락처', 30),
            parentName: text(row.parentName, '보호자 이름'), parentPhone: text(row.parentPhone, '보호자 연락처', 30), parentEmail: text(row.parentEmail, '이메일'), reportYn: row.reportYn === true };
          if (existing?.id === user.id) need(data.role === existing.role && data.status === 'APPROVED', '본인의 권한과 승인 상태는 변경할 수 없습니다.');
          if (role === 'STUDENT' && data.status === 'APPROVED' && !(existing?.role === 'STUDENT' && existing.status === 'APPROVED')) {
            const academy = await tx.academy.findUniqueOrThrow({ where: { id: academyId } });
            const count = await tx.member.count({ where: { academyId, role: 'STUDENT', status: 'APPROVED' } });
            need(count < academy.maxStudents, '계약 정원을 초과했습니다. 본사에 정원 변경을 요청해 주세요.');
          }
          if (row.password) {
            const rawPw = String(row.password).trim();
            const isMasked = !rawPw || /^[•·*]+$/.test(rawPw);
            if (!isMasked) {
              const minLen = role === 'STUDENT' ? 6 : 12;
              need(rawPw.length >= minLen && rawPw.length <= 128, role === 'STUDENT' ? '비밀번호는 6~128자로 입력해 주세요.' : '비밀번호는 12~128자로 입력해 주세요.');
              data.password = hashPassword(rawPw);
            }
          }
          need(existing || data.password, '신규 회원의 비밀번호를 입력해 주세요.');
          if (existing) {
            need(row.updatedAt === existing.updatedAt.toISOString(), '다른 관리자가 수정한 회원입니다. 새로고침 후 다시 저장해 주세요.', 409);
            const result = await tx.member.updateMany({ where: { id: existing.id, updatedAt: existing.updatedAt }, data });
            need(result.count === 1, '회원 정보가 변경되었습니다.', 409);
            saved.push(await tx.member.findUnique({ where: { id: existing.id }, select: memberFields }));
          } else saved.push(await tx.member.create({ data, select: memberFields }));
        }
        return saved;
      }, { timeout: 30000 }); return res.json({ items });
    }
    if (entity === 'classes') {
      need(user.role !== 'TEACHER', '학급 변경은 원장 또는 본사 관리자만 가능합니다.', 403);
      const existing = input.id && await prisma.classGroup.findFirst({ where: { id: input.id, academyId } });
      need(!input.id || existing, '학급을 찾을 수 없습니다.', 404);
      if (body.operation === 'delete') { await prisma.classGroup.delete({ where: { id: existing.id } }); return res.json({ ok: true }); }
      const data = { academyId, name: text(input.name, '학급명', 100, true), targetGrade: text(input.targetGrade, '대상 학년') };
      return res.json({ item: existing ? await prisma.classGroup.update({ where: { id: existing.id }, data }) : await prisma.classGroup.create({ data }) });
    }
    if (entity === 'assignments') {
      if (body.operation === 'delete') { const result = await prisma.bookAssignment.deleteMany({ where: { id: input.id, academyId } }); need(result.count, '배정 내역을 찾을 수 없습니다.', 404); return res.json({ ok: true }); }
      const book = await prisma.book.findFirst({ where: { OR: [{ id: String(input.bookId || '') }, { bookNo: String(input.bookId || '') }] } }); need(book, '도서를 선택해 주세요.');
      const members = await prisma.member.findMany({ where: { academyId, role: 'STUDENT', status: 'APPROVED', ...(input.classGroupId ? { classGroupId: input.classGroupId } : { OR: [{ id: String(input.memberId || '') }, { username: String(input.memberId || '') }] }) }, select: { id: true } });
      need(members.length, '배정할 재원생이 없습니다.');
      await prisma.$transaction(async tx => {
        for (const member of members) {
          // 같은 원생·도서 배정이 동시에 추가되지 않도록 회원 행 잠금을 사용합니다.
          await tx.$queryRaw`SELECT id FROM members WHERE id = ${member.id} FOR UPDATE`;
          if (!await tx.bookAssignment.findFirst({ where: { academyId, memberId: member.id, bookId: book.id, isCompleted: false } })) await tx.bookAssignment.create({ data: { academyId, memberId: member.id, bookId: book.id, status: 'ASSIGNED' } });
        }
      }, { timeout: 30000 }); return res.json({ ok: true, count: members.length });
    }
    if (entity === 'payments') {
      master(user);
      need(typeof input.requestId === 'string' && /^[a-zA-Z0-9-]{20,80}$/.test(input.requestId), '입금 등록을 다시 시작해 주세요.');
      const previous = await prisma.payment.findUnique({ where: { payCode: 'MANUAL-' + input.requestId } });
      if (previous) { need(previous.academyId === academyId, '이미 사용한 등록 번호입니다.', 409); return res.json({ item: previous }); }
      const amount = Number(input.amount); need(Number.isSafeInteger(amount) && amount > 0, '입금액을 확인해 주세요.');
      need(Number.isSafeInteger(Number(input.slotCount)) && Number(input.slotCount) > 0, '계약 정원을 확인해 주세요.');
      const payment = await prisma.payment.create({ data: { academyId, payCode: 'MANUAL-' + input.requestId, amount, plan: enumValue(input.plan || 'STANDARD', ['BASIC','STANDARD','PREMIUM','VIP','ROYAL'], '요금제') as any,
        slotCount: Number(input.slotCount) || 50, payMethod: 'TRANSFER', status: 'PAID', paidAt: date(input.paidAt, '입금 확인') } });
      return res.json({ item: payment });
    }
    master(user);
    if (entity === 'academies') {
      const existing = input.id && await prisma.academy.findUnique({ where: { id: input.id } }); need(!input.id || existing, '학원을 찾을 수 없습니다.', 404);
      if (body.operation === 'delete') { need(existing.id !== user.academyId, '본사 계정의 소속 학원은 삭제할 수 없습니다.'); await prisma.academy.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: 'SUSPENDED' } }); return res.json({ ok: true }); }
      if (body.operation === 'restore') { need(existing.deletedAt, '삭제된 학원이 아닙니다.'); return res.json({ item: await prisma.academy.update({ where: { id: existing.id }, data: { deletedAt: null, status: 'ACTIVE' } }) }); }
      const data = { code: text(input.code, '학원 코드', 60, true), name: text(input.name, '학원명', 200, true), bizNo: text(input.bizNo, '사업자등록번호', 50), directorName: text(input.directorName, '원장 이름', 100, true), phone: text(input.phone, '연락처', 30), email: text(input.email, '이메일', 200), address: text(input.address, '주소', 500), memo: text(input.memo, '메모', 20000), joinDate: date(input.joinDate || input.startDate, '등록'),
        maxStudents: Number(input.maxStudents), monthlyFee: Number(input.monthlyFee) || 0, plan: enumValue(input.plan || 'STANDARD', ['BASIC','STANDARD','PREMIUM','VIP','ROYAL'], '요금제') as any,
        status: enumValue(input.status || 'ACTIVE', ['ACTIVE','SUSPENDED','TERMINATED'], '학원 상태') as any, startDate: date(input.startDate, '시작'), endDate: date(input.endDate, '종료') };
      need(Number.isSafeInteger(data.maxStudents) && data.maxStudents > 0 && Number.isSafeInteger(data.monthlyFee) && data.monthlyFee >= 0 && data.endDate > data.startDate, '정원과 계약 기간·이용료를 확인해 주세요.');
      if (existing) need(data.maxStudents >= await prisma.member.count({ where: { academyId: existing.id, role: 'STUDENT', status: 'APPROVED' } }), '재원생 수보다 정원을 줄일 수 없습니다.');
      return res.json({ item: existing ? await prisma.academy.update({ where: { id: existing.id }, data }) : await prisma.academy.create({ data }) });
    }
    if (entity === 'books') {
      if (body.operation === 'delete') { need(!await prisma.quizAttempt.count({ where: { bookId: input.id } }), '학습 기록이 있는 도서는 삭제할 수 없습니다.'); await prisma.book.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      const data = { bookNo: text(input.bookNo, '도서 코드', 100, true), title: text(input.title, '도서명', 300, true), author: text(input.author, '저자', 200, true), publisher: text(input.publisher, '출판사'), isbn: text(input.isbn, 'ISBN'), grade: text(input.grade, '권장 학년'), category: text(input.category, '분류'), description: text(input.description, '소개', 20000), thinkQuiz: text(input.thinkQuiz, '생각담기', 3000) };
      need(/^[A-Za-z0-9_-]+$/.test(data.bookNo), '도서 코드는 영문·숫자·하이픈·밑줄로 입력해 주세요.');
      for (const url of [input.coverUrl,input.worksheetUrl].filter(Boolean)) need(/^https:\/\//.test(url), '자료 주소는 HTTPS 주소를 사용해 주세요.');
      if (input.themeId) need(await prisma.themeCategory.findUnique({ where: { id: input.themeId } }), '테마를 확인해 주세요.');
      const extra = { themeId: input.themeId || null, isRecommended: input.isRecommended === true, coverUrl: text(input.coverUrl, '표지 주소', 2000), worksheetUrl: text(input.worksheetUrl, '학습지 주소', 2000), tags: text(input.tags, '태그', 2000), series: text(input.series, '시리즈') };
      return res.json({ item: input.id ? await prisma.book.update({ where: { id: input.id }, data: { ...data, ...extra } }) : await prisma.book.create({ data: { ...data, ...extra } }) });
    }
    if (entity === 'quizzes') {
      if (body.operation === 'delete') { await prisma.bookQuiz.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      need(await prisma.book.findUnique({ where: { id: input.bookId } }), '도서를 찾을 수 없습니다.');
      const options = Array.isArray(input.options) ? input.options.map((o: any) => text(o, '보기', 1000, true)) : [];
      need(options.length >= 2 && options.length <= 5 && new Set(options).size === options.length, '서로 다른 보기 2~5개를 입력해 주세요.');
      need(Number.isInteger(Number(input.correctAnswer)) && Number(input.correctAnswer) > 0 && Number(input.correctAnswer) <= options.length, '정답 번호를 확인해 주세요.');
      const data = { bookId: input.bookId, questionNo: Number(input.questionNo), question: text(input.question, '문항', 5000, true), options, correctAnswer: String(input.correctAnswer), quizType: 'MULTIPLE_CHOICE' as const };
      need(Number.isInteger(data.questionNo) && data.questionNo > 0, '문항 번호를 확인해 주세요.');
      const item = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM books WHERE id = ${data.bookId} FOR UPDATE`;
        need(!await tx.bookQuiz.findFirst({ where: { bookId: data.bookId, questionNo: data.questionNo, ...(input.id ? { id: { not: input.id } } : {}) } }), '이미 있는 문항 번호입니다. 다른 번호를 입력해 주세요.', 409);
        return input.id ? tx.bookQuiz.update({ where: { id: input.id }, data }) : tx.bookQuiz.create({ data });
      }); return res.json({ item });
    }
    if (entity === 'notices') {
      if (body.operation === 'delete') { await prisma.notice.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      const data = { title: text(input.title, '제목', 300, true), content: text(input.content, '내용', 20000, true), isPinned: input.isPinned === true, targetRole: input.targetRole ? enumValue(input.targetRole, ['STUDENT','TEACHER','DIRECTOR','MASTER'], '대상') as any : null };
      return res.json({ item: input.id ? await prisma.notice.update({ where: { id: input.id }, data }) : await prisma.notice.create({ data }) });
    }
    if (entity === 'themes') {
      if (body.operation === 'delete') { await prisma.themeCategory.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      const data = { code: text(input.code, '코드', 60, true), name: text(input.name, '테마명', 200, true), description: text(input.description, '설명', 3000) };
      return res.json({ item: input.id ? await prisma.themeCategory.update({ where: { id: input.id }, data }) : await prisma.themeCategory.create({ data }) });
    }
    if (entity === 'banners') {
      if (body.operation === 'delete') { await prisma.mainBanner.delete({ where: { id: input.id } }); return res.json({ ok: true }); }
      for (const url of [input.imageUrl,input.linkUrl].filter(Boolean)) need(/^https:\/\//.test(url), '이미지와 연결 주소는 HTTPS 주소를 사용해 주세요.');
      const data = { title: text(input.title, '배너명', 200, true), imageUrl: text(input.imageUrl, '이미지 주소', 2000), linkUrl: text(input.linkUrl, '연결 주소', 2000), isActive: input.isActive === true, orderNo: Number(input.orderNo) || 0 };
      return res.json({ item: input.id ? await prisma.mainBanner.update({ where: { id: input.id }, data }) : await prisma.mainBanner.create({ data }) });
    }
    need(false, '지원하지 않는 항목입니다.', 404);
  } catch (error) { return failure(res, error); }
}
