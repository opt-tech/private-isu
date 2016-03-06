import 'babel-polyfill';
import Nightmare from 'nightmare';
import {expect} from 'chai';

const baseurl = process.env.TARGET_URL || "http://localhost:8080";

const option = {
  show: true,
  waitTimeout: 10000,
};

const shortWait = 100;
const mediumWait = 2000;
const longWait = 5000;

describe('e2etest', () => {
  let nightmare;

  before(async () => {
    nightmare = new Nightmare(option);
    await nightmare
    .goto(`${baseurl}/initialize`)
    ;
  });
  after(async () => {
    await nightmare.end();
  });
  beforeEach(async () => {
    await nightmare
    .goto(`${baseurl}/logout`)
    await nightmare.wait(shortWait)
    ;
  });

  it('トップページが継ぎ足しできる', async () => {
    await nightmare
    .goto(`${baseurl}/`)
    .wait(shortWait)
    .scrollTo(100000, 0) // 一番下まで
    .wait(shortWait)
    .click('#isu-post-more-btn')
    .wait(longWait)
    ;

    const postLen1 = await nightmare.evaluate(function() {
      return document.querySelectorAll('.isu-post').length;
    });
    expect(39).to.equal(postLen1);

    await nightmare
    .scrollTo(100000, 0) // 一番下まで
    .wait(shortWait)
    .click('#isu-post-more-btn')
    .wait(longWait)
    ;

    const postLen2 = await nightmare.evaluate(function() {
      return document.querySelectorAll('.isu-post').length;
    });
    expect(58).to.equal(postLen2);
  });

  it('コメントできる', async () => {
    await nightmare
    .goto(`${baseurl}/login`)
    .type('input[name=account_name]', 'mary')
    .type('input[name=password]', 'marymary')
    .click('input[type=submit]')
    .wait(longWait)
    ;

    const [id, commentCount] = await nightmare.evaluate(function() {
      return [document.querySelector('.isu-post').id, document.querySelector('.isu-post-comment-count b').textContent];
    });

    const urlAfterComment = await nightmare
    .scrollTo(300, 0) // コメント欄が見えるまで
    .type('.isu-comment-form input[name=comment]', 'あいうえお かきくけこ')
    .click('.isu-comment-form input[type=submit]')
    .wait(mediumWait)
    .url()
    ;
    expect(urlAfterComment).to.equal(`${baseurl}/posts/${id}`);

    const commentCount2 = await nightmare.evaluate(function() {
      return document.querySelector('.isu-post-comment-count b').textContent;
    });
    expect(commentCount2).to.equal(+commentCount + 1 + '');
  });

  it('banできる', async () => {
    await nightmare
    .goto(`${baseurl}/login`)
    .type('input[name=account_name]', 'mary') // adminユーザー
    .type('input[name=password]', 'marymary')
    .click('input[type=submit]')
    .wait(shortWait)
    .goto(`${baseurl}/admin/banned`)
    .wait(shortWait)
    ;

    const name = await nightmare.evaluate(function() {
      return document.querySelector('input[name="uid[]"]').getAttribute('data-account-name');
    });

    const titleBeforeBan = await nightmare
    .goto(`${baseurl}/@${name}`)
    .title()
    ;
    expect(titleBeforeBan).to.equal('Iscogram'); // banされる前は普通に見れてる

    await nightmare
    .goto(`${baseurl}/admin/banned`)
    .wait(shortWait)
    .check('input[name="uid[]"]')
    .scrollTo(100000, 0) // 一番下まで
    .wait(shortWait)
    .click('input[type="submit"]')
    .wait(shortWait)
    ;

    const titleAfterBan = await nightmare
    .goto(`${baseurl}/@${name}`)
    .title()
    ;
    expect(titleAfterBan).to.equal('') // ステータスコードをチェックする方法が無いのでとりあえず
  });

  it('新規登録、ログアウト、ログインできる', async () => {
    const urlAfterLogin = await nightmare
    .goto(`${baseurl}/register`)
    .wait(mediumWait)
    .type('input[name=account_name]', 'catatsuy')
    .type('input[name=password]', 'catatsuy')
    .click('input[type=submit]')
    .wait(longWait)
    .goto(`${baseurl}/logout`)
    .wait(shortWait)
    .goto(`${baseurl}/login`)
    .type('input[name=account_name]', 'catatsuy')
    .type('input[name=password]', 'catatsuy')
    .click('input[type=submit]')
    .wait(longWait)
    .url()
    ;
    expect(urlAfterLogin).to.equal(`${baseurl}/`);

    const name = await nightmare.evaluate(function() {
      return document.querySelector('.isu-account-name a').textContent;
    });
    expect('catatsuyさん').to.equal(name);
  });
});
