import Model, { attr } from '@ember-data/model';
import { computed } from '@ember/object';

export default class Team extends Model {
  @attr email;
  @attr name;
  @attr login;
  @attr api_token;
  @attr avatar;
  @attr url;
  @attr kind;

  @computed('login', function () {
    let login = this.login;
    let login_split = login.split(':');
    return login_split[1];
  })
  org_name;

  @computed('name', 'org_name', function () {
    let { name, org_name } = this.getProperties('name', 'org_name');
    return `${org_name}/${name}`;
  })
  display_name;
}
