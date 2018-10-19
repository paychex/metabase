import React from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { dissoc } from "icepick";
import { t, jt } from "c-3po";

import { push } from "react-router-redux";
import * as Urls from "metabase/lib/urls";

import Dashboards from "metabase/entities/dashboards";

import EntityForm from "metabase/entities/containers/EntityForm";
import ModalContent from "metabase/components/ModalContent";

import { getDashboardComplete } from "../selectors";

const mapStateToProps = (state, props) => {
  return {
    dashboard: getDashboardComplete(state, props),
  };
};

const mapDispatchToProps = {
    copyDashboard: Dashboards.actions.copy,
    onChangeLocation: push,
};

@withRouter
@connect(mapStateToProps, mapDispatchToProps)
class DashboardCopyModal extends React.Component {
  render() {
    const { onClose, onChangeLocation, copyDashboard, dashboard, ...props } = this.props;
    return (
      <ModalContent
        title={jt`Copy "${(dashboard && dashboard.name) || t`item`}"`}
        onClose={onClose}
      >
        <EntityForm
          entityType={"dashboards"}
          entityObject={{
            ...dissoc(dashboard, "id"),
            name: dashboard && (dashboard.name + " - " + t`Copy`)
          }}
          create={async values => {
            return await copyDashboard(
              { id: dashboard.id },
              dissoc(values, "id"),
            )
          }}
          onClose={onClose}
          onSaved={dashboard => onChangeLocation(Urls.dashboard(dashboard.id))}
          submitTitle={t`Copy`}
          {...props}
        />
      </ModalContent>
    );
  }
}

export default DashboardCopyModal;
