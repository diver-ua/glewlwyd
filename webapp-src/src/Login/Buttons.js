import React, { Component } from 'react';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';

class Buttons extends Component {
  constructor (props) {
    super(props);
    this.state = {
      config: props.config,
      userList: props.userList,
      currentUser: props.currentUser,
      disableContinue: true,
      showGrant: props.showGrant,
      bGrantTitle: props.showGrant?i18next.t("login.grant-auth-title"):i18next.t("login.grant-change-title"),
      bGrant: props.showGrant?i18next.t("login.grant-auth"):i18next.t("login.grant-change")
    };

    this.clickProfile = this.clickProfile.bind(this);
    this.clickLogout = this.clickLogout.bind(this);
    this.clickGrant = this.clickGrant.bind(this);
    this.clickContinue = this.clickContinue.bind(this);
    this.newUser = this.newUser.bind(this);
    
    messageDispatcher.subscribe('Buttons', (message) => {
      if (message === "enableContinue") {
        this.setState({disableContinue: false});
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      userList: nextProps.userList,
      currentUser: nextProps.currentUser,
      config: nextProps.config,
      showGrant: nextProps.showGrant,
      bGrantTitle: nextProps.showGrant?i18next.t("login.grant-auth-title"):i18next.t("login.grant-change-title"),
      bGrant: nextProps.showGrant?i18next.t("login.grant-auth"):i18next.t("login.grant-change")
    });
  }

  clickProfile() {
    document.location.href = this.state.config.ProfileUrl;
  }

  clickLogout() {
    apiManager.glewlwydRequest("/auth/", "DELETE")
    .then(() => {
      messageDispatcher.sendMessage('App', 'InitProfile');
    })
    .fail(() => {
      messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("login.error-delete-session")});
    });
  }
  
  clickGrant() {
    messageDispatcher.sendMessage('App', 'ToggleGrant');
  }
  
  clickContinue() {
    if (this.state.config.params.callback_url) {
      document.location.href = this.state.config.params.callback_url+"&g_continue";
    }
  }

  newUser(e, user) {
    e.preventDefault();
    if (!user) {
      messageDispatcher.sendMessage('App', 'NewUser');
    } else {
      apiManager.glewlwydRequest("/auth/", "POST", {username: user})
      .then(() => {
        messageDispatcher.sendMessage('App', 'InitProfile');
      })
      .fail(() => {
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("login.error-login")});
      });
    }
  }

	render() {
    var bAnother = "";
    var bContinue = <button type="button" className="btn btn-primary" onClick={this.clickContinue} title={i18next.t("login.continue-title")} disabled={this.state.disableContinue}>{i18next.t("login.continue")}</button>;
    var bGrant = <button type="button" className="btn btn-primary" onClick={this.clickGrant} title={this.state.bGrantTitle}>{this.state.bGrant}</button>;
    if (this.state.currentUser) {
      var userList = [];
      this.state.userList.forEach((user, index) => {
        if (this.state.currentUser.username === user.username) {
          userList.push(<a className="dropdown-item active" href="#" onClick={(e) => this.newUser(e, user.username)} key={index} alt={user.name || user.username}>{user.name || user.username}</a>);
        } else {
          userList.push(<a className="dropdown-item" href="#" onClick={(e) => this.newUser(e, user.username)} key={index} alt={user.name || user.username}>{user.name || user.username}</a>);
        }
      });
      bAnother = 
      <div className="btn-group" role="group">
        <div className="dropdown">
          <button className="btn btn-primary dropdown-toggle" type="button" id="selectNewUser" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {i18next.t("login.login-another")}
          </button>
          <div className="dropdown-menu" aria-labelledby="selectNewUser">
            <a className="dropdown-item" href="#" onClick={(e) => this.newUser(e, false)}>{i18next.t("login.login-another-new")}</a>
            <div className="dropdown-divider"></div>
            {userList}
          </div>
        </div>
      </div>;
    }
    if (this.state.currentUser) {
  		return (
        <div className="btn-group" role="group">
          {bContinue}
          <button type="button" className="btn btn-primary" onClick={this.clickProfile}>{i18next.t("login.update-profile")}</button>
          {bAnother}
          {bGrant}
          <button type="button" className="btn btn-primary" onClick={this.clickLogout}>{i18next.t("login.logout")}</button>
        </div>
  		);
    } else {
      return ("");
    }
	}
}

export default Buttons;
