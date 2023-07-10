import React from 'react';
import {withOnyx} from 'react-native-onyx';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import lodashGet from 'lodash/get';
import HeaderWithBackButton from './HeaderWithBackButton';
import iouReportPropTypes from '../pages/iouReportPropTypes';
import withLocalize, {withLocalizePropTypes} from './withLocalize';
import * as ReportUtils from '../libs/ReportUtils';
import * as Expensicons from './Icon/Expensicons';
import Text from './Text';
import participantPropTypes from './participantPropTypes';
import Avatar from './Avatar';
import styles from '../styles/styles';
import themeColors from '../styles/themes/default';
import CONST from '../CONST';
import withWindowDimensions from './withWindowDimensions';
import compose from '../libs/compose';
import Navigation from '../libs/Navigation/Navigation';
import ROUTES from '../ROUTES';
import Icon from './Icon';
import SettlementButton from './SettlementButton';
import * as Policy from '../libs/actions/Policy';
import ONYXKEYS from '../ONYXKEYS';
import * as IOU from '../libs/actions/IOU';
import * as CurrencyUtils from '../libs/CurrencyUtils';
import MenuItemWithTopDescription from './MenuItemWithTopDescription';
import DateUtils from '../libs/DateUtils';
import reportPropTypes from '../pages/reportPropTypes';
import * as UserUtils from '../libs/UserUtils';

const propTypes = {
    /** The report currently being looked at */
    report: iouReportPropTypes.isRequired,

    /** The expense report or iou report (only will have a value if this is a transaction thread) */
    parentReport: iouReportPropTypes,

    /** The policies which the user has access to and which the report could be tied to */
    policies: PropTypes.shape({
        /** Name of the policy */
        name: PropTypes.string,
    }).isRequired,

    /** The chat report this report is linked to */
    chatReport: reportPropTypes,

    /** Personal details so we can get the ones for the report participants */
    personalDetails: PropTypes.objectOf(participantPropTypes).isRequired,

    /** Whether we're viewing a report with a single transaction in it */
    isSingleTransactionView: PropTypes.bool,

    /** Session info for the currently logged in user. */
    session: PropTypes.shape({
        /** Currently logged in user email */
        email: PropTypes.string,
    }),

    ...withLocalizePropTypes,
};

const defaultProps = {
    isSingleTransactionView: false,
    chatReport: {},
    session: {
        email: null,
    },
    parentReport: {},
};

function MoneyRequestHeader(props) {
    // These are only used for the single transaction view and not for expense and iou reports
    const {amount: transactionAmount, currency: transactionCurrency, comment: transactionDescription} = ReportUtils.getMoneyRequestAction(props.parentReportAction);
    const formattedTransactionAmount = transactionAmount && transactionCurrency && CurrencyUtils.convertToDisplayString(transactionAmount, transactionCurrency);
    const transactionDate = lodashGet(props.parentReportAction, ['created']);
    const formattedTransactionDate = DateUtils.getDateStringFromISOTimestamp(transactionDate);

    const formattedAmount = CurrencyUtils.convertToDisplayString(ReportUtils.getMoneyRequestTotal(props.report), props.report.currency);
    const moneyRequestReport = props.parentReport;
    const isSettled = ReportUtils.isSettled(moneyRequestReport.reportID);
    const isExpenseReport = ReportUtils.isExpenseReport(moneyRequestReport);
    const payeeName = isExpenseReport ? ReportUtils.getPolicyName(moneyRequestReport, props.policies) : ReportUtils.getDisplayNameForParticipant(moneyRequestReport.managerID);
    const payeeAvatar = isExpenseReport
        ? ReportUtils.getWorkspaceAvatar(moneyRequestReport)
        : UserUtils.getAvatar(lodashGet(props.personalDetails, [moneyRequestReport.managerID, 'avatar']), moneyRequestReport.managerID);
    const policy = props.policies[`${ONYXKEYS.COLLECTION.POLICY}${props.report.policyID}`];
    const isPayer =
        Policy.isAdminOfFreePolicy([policy]) || (ReportUtils.isMoneyRequestReport(moneyRequestReport) && lodashGet(props.session, 'accountID', null) === moneyRequestReport.managerID);
    const bankAccountRoute = ReportUtils.getBankAccountRoute(props.chatReport);
    const shouldShowPaypal = Boolean(lodashGet(props.personalDetails, [moneyRequestReport.managerID, 'payPalMeAddress']));
    const report = props.report;
    report.ownerAccountID = lodashGet(props, ['parentReport', 'ownerAccountID'], null);
    report.ownerEmail = lodashGet(props, ['parentReport', 'ownerEmail'], '');
    return (
        <View style={[styles.highlightBG, styles.pl0]}>
            <HeaderWithBackButton
                shouldShowAvatarWithDisplay
                shouldShowPinButton
                shouldShowThreeDotsButton={!isPayer && !isSettled}
                threeDotsMenuItems={[
                    {
                        icon: Expensicons.Trashcan,
                        text: props.translate('common.delete'),
                        onSelected: () => {},
                    },
                ]}
                threeDotsAnchorPosition={styles.threeDotsPopoverOffsetNoCloseButton(props.windowWidth)}
                report={report}
                policies={props.policies}
                personalDetails={props.personalDetails}
                shouldShowBackButton={props.isSmallScreenWidth}
                onBackButtonPress={() => Navigation.goBack(ROUTES.HOME, false, true)}
            />
            <>
                <MenuItemWithTopDescription
                    title={formattedTransactionAmount}
                    shouldShowTitleIcon={isSettled}
                    titleIcon={Expensicons.Checkmark}
                    description={`${props.translate('iou.amount')} • ${props.translate('iou.cash')}${isSettled ? ` • ${props.translate('iou.settledExpensify')}` : ''}`}
                    titleStyle={styles.newKansasLarge}
                    disabled={isSettled}
                    // Note: These options are temporarily disabled while we figure out the required API changes
                    // shouldShowRightIcon={!isSettled}
                    // onPress={() => Navigation.navigate(ROUTES.getEditRequestRoute(props.report.reportID, CONST.EDIT_REQUEST_FIELD.AMOUNT))}
                />
                <MenuItemWithTopDescription
                    description={props.translate('common.description')}
                    title={transactionDescription}
                    disabled={isSettled}
                    // shouldShowRightIcon={!isSettled}
                    // onPress={() => Navigation.navigate(ROUTES.getEditRequestRoute(props.report.reportID, CONST.EDIT_REQUEST_FIELD.DESCRIPTION))}
                />
                <MenuItemWithTopDescription
                    description={props.translate('common.date')}
                    title={formattedTransactionDate}
                    // shouldShowRightIcon={!isSettled}
                    // onPress={() => Navigation.navigate(ROUTES.getEditRequestRoute(props.report.reportID, CONST.EDIT_REQUEST_FIELD.DATE))}
                />
            </>
        </View>
    );
}

MoneyRequestHeader.displayName = 'MoneyRequestHeader';
MoneyRequestHeader.propTypes = propTypes;
MoneyRequestHeader.defaultProps = defaultProps;

export default compose(
    withWindowDimensions,
    withLocalize,
    withOnyx({
        chatReport: {
            key: ({report}) => `${ONYXKEYS.COLLECTION.REPORT}${report.chatReportID}`,
        },
        session: {
            key: ONYXKEYS.SESSION,
        },
        parentReport: {
            key: (props) => `${ONYXKEYS.COLLECTION.REPORT}${props.report.parentReportID}`,
        },
    }),
)(MoneyRequestHeader);
