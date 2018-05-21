import Promise from 'promise-polyfill';
import Vue from 'vue';
import axios from 'axios';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';

import storeInstance from '../frontend/store';
import messagingInstance from '../shared/messaging';
import accountHeaderApp from './header';
import accountBuyerApp from './buyer';
import accountSellerApp from './seller';
import accountServiceApp from './service';
import accountServicesApp from './services';
import accountOrderRequirementsApp from './orderRequirements';
import accountOrderApp from './order';
import accountInboxApp from './inbox';
import accountSettingsApp from './settings';
import accountBalanceApp from './balance';
import accountEarningsApp from './earnings';
import accountDiscountsApp from './discounts';
import accountAffiliateApp from './affiliate';
import accountDashboardApp from './dashboard';
import accountFavoritesApp from './favorites';
import accountInviteApp from './invite';
import accountEndorseApp from './endorse';
import noticeApp from './notice';
import accountPromoteYourselfApp from './promoteYourself';
import './style/index.scss';


// Installing Promise polyfill
if (!window.Promise) {
    window.Promise = Promise;
}

// Add custom header to every XHR request
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';


if (window.SM_BOOTSTRAP_DATA) {
    storeInstance.bootstrap(window.SM_BOOTSTRAP_DATA);

    if (storeInstance.state.config.sentry) {
        // Install Raven
        
        let raven = Raven.config(
            storeInstance.state.config.sentry.dsn, { debug: true }
        ).addPlugin(RavenVue, Vue).install();

        window.onunhandledrejection = function(evt) {
            Raven.captureException(evt.reason);
        };
    }

    if (storeInstance.state.user && storeInstance.state.config.messaging) {
        messagingInstance.init(storeInstance.state.config.messaging.server, storeInstance.state.user);
    }
}


accountHeaderApp.$mount('#sm-account-header');

if (document.getElementById('invite-noticer')) {
    noticeApp.$mount('#invite-noticer');
}

if (document.getElementById('sm-account-buyer')) {
    accountBuyerApp.$mount('#sm-account-buyer');
}

if (document.getElementById('sm-account-seller')) {
    accountSellerApp.$mount('#sm-account-seller');
}

if (document.getElementById('sm-account-service')) {
    accountServiceApp.$mount('#sm-account-service');
}

if (document.getElementById('sm-account-services')) {
    accountServicesApp.$mount('#sm-account-services');
}

if (document.getElementById('sm-account-order-requirements')) {
    accountOrderRequirementsApp.$mount('#sm-account-order-requirements');
}

if (document.getElementById('sm-account-order')) {
    accountOrderApp.$mount('#sm-account-order');
}

if (document.getElementById('sm-account-inbox')) {
    accountInboxApp.$mount('#sm-account-inbox');
}

if (document.getElementById('sm-account-settings')) {
    accountSettingsApp.$mount('#sm-account-settings');
}

if (document.getElementById('sm-account-balance')) {
    accountBalanceApp.$mount('#sm-account-balance');
}

if (document.getElementById('sm-account-earnings')) {
    accountEarningsApp.$mount('#sm-account-earnings');
}

if (document.getElementById('sm-account-discounts')) {
    accountDiscountsApp.$mount('#sm-account-discounts');
}

if (document.getElementById('sm-account-affiliate')) {
    accountAffiliateApp.$mount('#sm-account-affiliate');
}

if (document.getElementById('sm-account-dashboard')) {
    accountDashboardApp.$mount('#sm-account-dashboard');
}

if (document.getElementById('sm-account-favorites')) {
    accountFavoritesApp.$mount('#sm-account-favorites');
}

if (document.getElementById('sm-account-promote-yourself')) {
    accountPromoteYourselfApp.$mount('#sm-account-promote-yourself');
}

if (document.getElementById('sm-account-invite')) {
    accountInviteApp.$mount('#sm-account-invite');
}

if (document.getElementById('sm-account-endorse')) {
    accountEndorseApp.$mount('#sm-account-endorse');
}


const DISPUTE_KINDS_BUYER = [
    { kind: 'cant_do', label: 'The seller can’t do this job' },
    { kind: 'reorder', label: 'I need to reorder from this seller' },
    { kind: 'price', label: 'We couldn’t agree on the price' },
    { kind: 'no_response', label: 'The seller is not responding' },
    { kind: 'other', label: 'Other' }
];

const DISPUTE_KINDS_SELLER = [
    { kind: 'no_info', label: 'I didn\'t receive enough information from the buyer', resolutionKinds: ['cancel'] },
    { kind: 'reorder', label: 'The buyer is going to reorder', resolutionKinds: ['cancel'] },
    { kind: 'not_able', label: 'I\'am not able to do this job', resolutionKinds: ['cancel'] },
    { kind: 'price', label: 'We couldn’t agree on the price', resolutionKinds: ['cancel'] },
    { kind: 'personal', label: 'Due to personal/technical reasons, I cannot complete the work', resolutionKinds: ['cancel'] },
    { kind: 'extra_work', label: 'The buyer requested extra work which has not been offered', resolutionKinds: ['cancel', 'complete'] },
    { kind: 'no_response', label: 'The buyer is not responding', resolutionKinds: ['cancel', 'complete'] },
    { kind: 'other', label: 'Other', resolutionKinds: ['cancel', 'complete'] }
];

const RESOLUTION_KINDS_SELLER = [
    { kind: 'complete', label: 'Ask the buyer to complete this order and release the payment' },
    { kind: 'cancel', label: 'Ask the buyer to cancel this order' }
];

const RESOLUTION_KINDS_BUYER = [
    { kind: 'cancel', label: 'Ask the seller to cancel this order' }
];


if (document.getElementById('sm-account-order-dispute')) {
    new Vue({
        el: '#sm-account-order-dispute',
        data: {
            sharedState: storeInstance.state,

            disputeKinds: [],
            resolutionKinds: [],

            disputeKind: null,
            resolutionKind: null,

            step: 1,

            dispute: {
                text: ''
            },

            error: null,
            loading: false,
            sent: false
        },
        mounted: function() {
            if (this.sharedState.extra.mode === 'buyer') {
                this.disputeKinds = DISPUTE_KINDS_BUYER;
            } else {
                this.disputeKinds = DISPUTE_KINDS_SELLER;
            }
        },
        watch: {
            step: function(step) {
                if (step === 2) {
                    if (this.sharedState.extra.mode === 'seller') {
                        this.resolutionKinds = RESOLUTION_KINDS_SELLER.filter(item => this.disputeKind.resolutionKinds.indexOf(item.kind) !== -1);
                    } else {
                        this.resolutionKinds = RESOLUTION_KINDS_BUYER;
                        this.resolutionKind = RESOLUTION_KINDS_BUYER[0];
                    }
                }
            }
        },
        methods: {
            handleSendClick: function() {
                let data = Object.assign({ kind: this.disputeKind.kind, resolution_kind: this.resolutionKind.kind }, this.dispute);

                this.loading = true;
                this.error = null;
                axios.post('/api/account/' + this.sharedState.extra.mode + '/orders/' + this.sharedState.extra.order.id + '/dispute', data).then(res => {
                    this.loading = false;
                    this.sent = true;
                    window.location.href = storeInstance.urlFor('order', [this.sharedState.extra.order.id]);
                }).catch(err => {
                    this.loading = false;
                    if (err.response && err.response.status === 400) {
                        this.error = 'Please check that you provided all necessary informartion requested by service provider';
                    } else {
                        this.error = 'Something wrong has just happened. We already notified about this issue, and kindly ask you try this operation again a little later';
                    }
                });
            }
        }
    });
}

if (document.getElementById('sm-account-order-review')) {
    new Vue({
        el: '#sm-account-order-review',
        data: {
            sharedState: storeInstance.state,

            orderReviewFeedback: '',
            orderReviewRate: '0',

            error: null,
            loading: false,
            sent: false
        },
        methods: {
            handleRateOrderClick: function() {
                let data = {
                    text: this.orderReviewFeedback,
                    rating: +this.orderReviewRate
                };

                this.loading = true;
                this.error = null;
                axios.post('/api/account/' + this.sharedState.extra.mode + '/orders/' + this.sharedState.extra.order.id + '/feedback', data).then(resp => {
                    this.sent = true;
                    this.loading = false;
                }).catch(err => {
                    this.loading = false;
                    this.error = 'Something wrong has just happened. We already notified about this issue, and kindly ask you try this operation again a little later';
                });
            }
        }
    });
}

if (document.getElementById('sm-become-premium')) {
    new Vue({
        el: '#sm-become-premium',
        data: {
            useCoupon: false
        },
        mounted() {
            this.useCoupon = storeInstance.state.extra.use_coupon;
        }
    });
}
