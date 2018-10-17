import React from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { dissocIn } from "icepick";
import { t } from "c-3po";

import * as Urls from "metabase/lib/urls";

import Dashboards from "metabase/entities/dashboards";

import EntityForm from "metabase/entities/containers/EntityForm";
import ModalContent from "metabase/components/ModalContent";

import { getDashboardComplete } from "../selectors";

const mapStateToProps = (state, props) => {
  console.log("MAP STATE TO PROPS")
  console.log(state)
  console.log(props)
  console.log(getDashboardComplete(state, props))
  return {
    dashboard: getDashboardComplete(state, props),
  };
};

const mapDispatchToProps = {
    copy: Dashboards.actions.copy,
};

@withRouter
@connect(mapStateToProps, mapDispatchToProps)
class DashboardCopyModal extends React.Component {
  render() {
    const { onClose, copy, dashboard, ...props } = this.props;
    console.log("HERE ARE MY PROPS");
    console.log(this.props);
    console.log(this.state);
    return (
      <ModalContent
        title={t`Copy ` + "\"" + dashboard.name + "\""}
        onClose={onClose}
      >
        <EntityForm
          entityType="dashboards"
          entityObject={{
            ...dashboard,
            name: dashboard.name + " - " + t`Copy`
          }}
          update={async values => {
            await copy(
              { id: this.props.params.dashboardId },
              dissocIn(values, "id")
            )
          }}
          onClose={onClose}
          onSaved={dashboard => {
            //onChangeLocation(Urls.dashboard(dashboard.id));
            if (onClose) {
              onClose();
            }
          }}
          submitTitle={t`Copy`}
          {...props}
        />
      </ModalContent>
    );
  }
}

export default DashboardCopyModal;