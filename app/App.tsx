import { Icon, Layout, Menu, Spin } from 'antd';
import cookies from 'js-cookie';
import React from 'react';
import { hot } from 'react-hot-loader/root';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import {
  Link,
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';

import IconFont from '#app/components/Icon';
import { INTL_LOCALES } from '#app/config';
import service from '#app/config/service';
import { LanguageContext } from '#app/context';
import Console from '#app/modules/Console';
import Explore from '#app/modules/Explore';
import Import from '#app/modules/Import';
import Schema from '#app/modules/Schema';
import CreateSpace from '#app/modules/Schema/CreateSpace';
import SpaceConfig from '#app/modules/Schema/SpaceConfig';
import '#app/static/fonts/iconfont.css';
import logo from '#app/static/images/studio-logo.png';
import { IDispatch, IRootState } from '#app/store';
import { updateQueryStringParameter } from '#app/utils';

import './App.less';
import ConfigServer from './modules/ConfigServer';
import PrivateRoute from './PrivateRoute';
import { handleTrackEvent, trackEvent } from './utils/stat';

const { Header, Content } = Layout;

interface IState {
  loading: boolean;
  activeMenu: string;
}

const mapDispatch = (dispatch: IDispatch) => ({
  asyncClearConfigServer: dispatch.nebula.asyncClearConfigServer,
  asyncSwitchSpace: dispatch.nebula.asyncSwitchSpace,
});

const mapState = (state: IRootState) => ({
  appVersion: state.app.version,
});

interface IProps
  extends RouteComponentProps,
    ReturnType<typeof mapDispatch>,
    ReturnType<typeof mapState> {}

class App extends React.Component<IProps, IState> {
  currentLocale = 'ZH_CN';
  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: true,
      activeMenu: '',
    };
  }

  toggleLanguage = (locale: string) => {
    cookies.set('locale', locale);
    trackEvent('navigation', 'change_language', locale);
    window.location.href = updateQueryStringParameter(
      window.location.href,
      'lang',
      locale,
    );
  };

  loadIntlLocale = () => {
    intl
      .init({
        currentLocale: this.currentLocale,
        locales: INTL_LOCALES,
      })
      .then(() => {
        this.setState({
          loading: false,
        });
      });
  };

  handleMenuClick = ({ key }) => {
    if (key === 'newRelease') {
      return;
    }
    this.setState({
      activeMenu: key,
    });
  };

  componentWillMount() {
    // Initialize the import task
    service.handleImportAction({ taskAction: 'actionStopAll' });
  }

  componentDidMount() {
    this.loadIntlLocale();
    this.renderMenu();
    const space = sessionStorage.getItem('currentSpace');
    if (space) {
      this.props.asyncSwitchSpace(space);
    }
    document.addEventListener('click', handleTrackEvent);
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.renderMenu();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', handleTrackEvent);
  }
  renderMenu = () => {
    const path = this.props.location.pathname.split('/')[1] || '';
    this.setState({
      activeMenu: path === 'space' ? 'schema' : path,
    });
  };

  handleClear = () => {
    this.props.asyncClearConfigServer();
  };

  back2Nav = () =>
    window.top.postMessage(
      JSON.stringify({ from: 'studio', event: 'back' }),
      '*',
    );

  render() {
    const { loading, activeMenu } = this.state;
    return (
      <>
        <LanguageContext.Provider
          value={{
            currentLocale: this.currentLocale,
            toggleLanguage: this.toggleLanguage,
          }}
        >
          {loading ? (
            <Spin />
          ) : (
            <Layout className="nebula-graph-studio">
              <Header>
                <div className="studio-logo" onClick={this.back2Nav}>
                  <img src={logo} />
                </div>
                <Menu
                  mode="horizontal"
                  selectedKeys={[activeMenu]}
                  onClick={this.handleMenuClick as any}
                >
                  <Menu.Item key="schema">
                    <Link
                      to="/schema"
                      data-track-category="navigation"
                      data-track-action="view_schema"
                      data-track-label="from_navigation"
                    >
                      <IconFont type="iconnav-model" />
                      {intl.get('common.schema')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="import">
                    <Link
                      to="/import"
                      data-track-category="navigation"
                      data-track-action="view_import"
                      data-track-label="from_navigation"
                    >
                      <Icon type="import" />
                      {intl.get('common.import')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="explore">
                    <Link
                      to="/explore"
                      data-track-category="navigation"
                      data-track-action="view_explore"
                      data-track-label="from_navigation"
                    >
                      <Icon type="branches" />
                      {intl.get('common.explore')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="console">
                    <Link
                      to="/console"
                      data-track-category="navigation"
                      data-track-action="view_console"
                      data-track-label="from_navigation"
                    >
                      <Icon type="code" />
                      {intl.get('common.console')}
                    </Link>
                  </Menu.Item>
                </Menu>
              </Header>
              <Content>
                <Switch>
                  <PrivateRoute
                    path="/schema"
                    exact={true}
                    component={Schema}
                  />
                  <PrivateRoute
                    path="/space/create"
                    exact={true}
                    component={CreateSpace}
                  />
                  <PrivateRoute
                    path="/space/:space/:type?/:action?"
                    component={SpaceConfig}
                  />
                  <PrivateRoute
                    path="/import"
                    exact={true}
                    component={Import}
                  />
                  <PrivateRoute
                    path="/explore"
                    exact={true}
                    component={Explore}
                  />
                  <PrivateRoute
                    path="/console"
                    exact={true}
                    component={Console}
                  />
                  <Route
                    path="/connect-server"
                    exact={true}
                    component={ConfigServer}
                  />
                  <Redirect to="/explore" />
                </Switch>
              </Content>
            </Layout>
          )}
        </LanguageContext.Provider>
      </>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(hot(App)));
