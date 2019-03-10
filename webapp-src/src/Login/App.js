import React, { Component } from 'react';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';
import Notification from '../lib/Notification';
import Buttons from './Buttons';
import Body from './Body';
import PasswordForm from './PasswordForm';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newUser: false,
      userList: [],
      currentUser: false,
      config: props.config,
      loaded: false,
      lang: i18next.language,
      grantScope: false,
      scope: [],
      scheme: false,
      client: false,
      showGrant: true
    };

    this.initProfile = this.initProfile.bind(this);
    this.checkClientScope = this.checkClientScope.bind(this);
    this.changeLang = this.changeLang.bind(this);

    this.initProfile();
    
    messageDispatcher.subscribe('App', (message) => {
      if (message === "InitProfile") {
        this.initProfile();
      } else if (message == "NewUser") {
        this.setState({newUser: true});
      } else if (message == "ToggleGrant") {
        this.setState({showGrant: !this.state.showGrant});
      }
    });
  }

  initProfile() {
    apiManager.glewlwydRequest("/profile")
    .then((res) => {
      var newState = {};
      if (res.length) {
        newState.currentUser = res[0];
      }
      newState.newUser = false;
      newState.userList = res;
      newState.loaded = true;
      this.setState(newState, () => {
        if (this.state.config.params.client_id && this.state.config.params.scope) {
          this.checkClientScope(this.state.config.params.client_id, this.state.config.params.scope);
        }
      });
    })
    .fail((error) => {
      if (error.status != 401) {
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("error-api-connect")});
      }
      this.setState({newUser: true, currentUser: false, userList: [], loaded: true});
    });
  }

  checkClientScope(clientId, scopeList) {
    apiManager.glewlwydRequest("/auth/grant/" + encodeURI(clientId) + "/" + encodeURI(scopeList))
    .then((res) => {
      var scopeGranted = [];
      var scopeGrantedDetails = {};
      var showGrant = true;
      res.scope.forEach((scope) => {
        if (scope.granted) {
          showGrant = false;
          scopeGranted.push(scope.name);
          scopeGrantedDetails[scope.name] = scope;
        }
      });
      if (showGrant) {
        this.setState({client: res.client, scope: res.scope, showGrant: showGrant});
      } else {
        apiManager.glewlwydRequest("/auth/scheme/?scope=" + scopeGranted.join(" "))
        .then((schemeRes) => {
          for (var scope in schemeRes) {
            schemeRes[scope].details = scopeGrantedDetails[scope];
          }
          this.setState({client: res.client, scope: res.scope, scheme: schemeRes, showGrant: showGrant});
        })
        .fail((error) => {
          messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("login.error-scheme-scope-api")});
        });
      }
    })
    .fail((error) => {
      messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("login.error-grant-api")});
    });
  }

  changeLang(e, lang) {
    i18next.changeLanguage(lang)
    .then(() => {
      this.setState({lang: lang});
    });
  }

	render() {
    var body = "";
    if (this.state.loaded) {
      if (this.state.newUser) {
        body = <PasswordForm config={this.state.config} callbackInitProfile={this.initProfile}/>;
      } else {
        body = <Body config={this.state.config} currentUser={this.state.currentUser} client={this.state.client} scope={this.state.scope} scheme={this.state.scheme} showGrant={this.state.showGrant}/>;
      }
    }
    var langList = [];
    ["en","fr"].forEach((lang, i) => {
      if (lang === i18next.language) {
        langList.push(<a className="dropdown-item active" href="#" key={i}>{lang}</a>);
      } else {
        langList.push(<a className="dropdown-item" href="#" onClick={(e) => this.changeLang(e, lang)} key={i}>{lang}</a>);
      }
    });
		return (
      <div>
        <div className="card center" id="userCard" tabIndex="-1" role="dialog" style={{marginTop: 20 + 'px', marginBottom: 20 + 'px'}}>
          <div className="card-header">
            <div className="float-right">
              <div className="dropdown">
                <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownLang" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  {i18next.t("select-lang")}
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownLang">
                  {langList}
                </div>
              </div>
            </div>
            <h2>{i18next.t("glewlwyd-sso-title")}</h2>
          </div>
          <div className="card-body">
            {body}
          </div>
          <div className="card-footer">
            <Buttons config={this.state.config} currentUser={this.state.currentUser} userList={this.state.userList} showGrant={this.state.showGrant}/>
          </div>
        </div>
        <Notification/>
      </div>
		);
	}
}

export default App;
