class DBFacade {
    constructor(pool) {
        this.pool = pool;
    }
    async loadConfigs(userValues) {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT * FROM configs');
            const results = result.rows ? result.rows : [];
            client.release();
            results.forEach(res => {
                userValues[res.username] = {
                    take: res.tp,
                    sl: res.stoploss,
                    numTargets: res.targets,
                    leverage: res.leverage
                }
            })
        } catch (err) {
            console.error(err);
        }
    }
    async updateUserValues(user, values) {
        try {
            const client = await this.pool.connect();
            await client.query(`UPDATE configs SET tp = ${values.take}, stoploss = ${values.sl}, leverage = ${values.leverage}, targets = ${values.numTargets} WHERE username = '${user}'`);
            client.release();
        } catch (err) {
            console.error(err);
        }
    }
    async removeUserValues(user, values) {
        try {
            const client = await this.pool.connect();
            await client.query(`DELETE FROM configs WHERETusername = '${user}'`);
            client.release();
        } catch (err) {
            console.error(err);
        }
    }
    
    async setSubscription(userId, endTime, username, adminId) {
        try {
            const client = await this.pool.connect();
            await client.query(`DELETE FROM subscribers WHERE user_id = ${userId} AND admin_id = '${adminId}'`);
            await client.query(`INSERT INTO subscribers VALUES (${userId}, ${endTime !== null ? endTime : 'NULL'}, '${username}', '${adminId}')`);
            client.release();
        } catch (err) {
            console.error(err);
        }
    }

    async setSubscription(userId, endTime, username, adminId) {
        try {
            const client = await this.pool.connect();
            await client.query(`DELETE FROM subscribers WHERE user_id = ${userId} AND admin_id = '${adminId}'`);
            await client.query(`INSERT INTO subscribers VALUES (${userId}, ${endTime !== null ? endTime : 'NULL'}, '${username}', '${adminId}')`);
            client.release();
        } catch (err) {
            console.error(err);
        }
    }

    async getSubscriptionData(userId, adminId) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from subscribers WHERE user_id = ${userId} AND admin_id = '${adminId}'`);
            client.release();
            return results.rows.length ? results.rows[0] : null;
        } catch (err) {
            console.error(err);
        }
    }

    async getSubscriptionForUser(userId) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from subscribers WHERE user_id = ${userId}`);
            client.release();
            return results.rows;
        } catch (err) {
            console.error(err);
        }
    }

    async getSubscriptionForUserInGroup(userId, chatId) {
        try {
            const client = await this.pool.connect();
            const chatRes = await client.query(`SELECT * FROM admins_groups WHERE chat_id = '${chatId}'`);
            if (!chatRes.rows.length) {
                return [];
            }
            const adminId = chatRes.rows[0].user_id;
            const results = await client.query(`select * from subscribers WHERE user_id = ${userId} AND admin_id = '${adminId}'`);
            client.release();
            return results.rows;
        } catch (err) {
            console.error(err);
        }
    }

    async getAdminName(adminId) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from admins WHERE user_id = '${adminId}'`);
            client.release();
            return results.rows && results.rows.length ? results.rows[0].user_name : '';
        } catch (err) {
            console.error(err);
        }
    }


    async getAllSubscriptionsByAdmin(adminId) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from subscribers WHERE admin_id = '${adminId}' ORDER BY end_time ASC NULLS LAST`);
            client.release();
            return results.rows;
        } catch (err) {
            console.error(err);
        }
    }
    async getAllSubscriptions() {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from subscribers WHERE end_time IS NOT NULL`);
            client.release();
            return results.rows;
        } catch (err) {
            console.error(err);
        }
    }
    async getAllEndedSubscriptions(time) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`select * from subscribers WHERE end_time < ${time}`);
            client.release();
            return results.rows;
        } catch (err) {
            console.error(err);
        }
    }
    async removeSubscriber(adminId, userId) {
        const client = await this.pool.connect();
        await client.query(`delete from subscribers WHERE user_id = ${userId} AND admin_id = '${adminId}'`);
        client.release();
    }
    async registerAdmin(userId, username, groupsQuota, usersQuota) {
        const client = await this.pool.connect();
        await client.query(`DELETE FROM admins WHERE user_id = '${userId}'`);
        await client.query(`INSERT INTO admins VALUES ('${userId}', '${username}', ${groupsQuota}, '${usersQuota}')`);
        client.release();
    }

    async getRegisteredAdmins() {
        const client = await this.pool.connect();
        const res = await client.query(`SELECT * FROM admins`);
        client.release();
        return res.rows;
    }

    async unregisterAdmin(userName) {
        const client = await this.pool.connect();
        const res = await client.query(`SELECT * FROM admins WHERE user_name = '${userName}'`);
        if (!res.rows) {
            return;
        }
        const admin = res.rows[0];
        await client.query(`DELETE FROM admins WHERE user_name = '${userName}'`);
        await client.query(`DELETE FROM subscribers WHERE admin_id = '${admin.user_id}'`);
        await client.query(`DELETE FROM admins_groups WHERE user_id = '${admin.user_id}'`);
        client.release();
    }

    async getRegisteredAdmin(userId) {
        const client = await this.pool.connect();
        const results = await client.query(`SELECT * FROM admins where user_id = '${userId}'`);
        client.release();
        return results.rows[0];
    }
    async getNumAdminGroups(userId) {
        const client = await this.pool.connect();
        const results = await client.query(`SELECT COUNT(*) FROM admins_groups where user_id = '${userId}'`);
        client.release();
        return results.rows[0].count;
    }

    async getNumAdminSubscribers(userId) {
        const client = await this.pool.connect();
        const results = await client.query(`SELECT COUNT(*) FROM subscribers where admin_id = '${userId}'`);
        client.release();
        return results.rows[0].count;
    }

    async associateAdminGroup(userId, chatId, groupName) {
        const client = await this.pool.connect();
        await client.query(`DELETE FROM admins_groups WHERE user_id = '${userId}' AND chat_id = '${chatId}'`);
        await client.query(`INSERT INTO admins_groups VALUES ('${userId}', '${chatId}', '${groupName}')`);
        client.release();
    }

    async unassociateAdminGroup(userId, chatId) {
        const client = await this.pool.connect();
        await client.query(`DELETE FROM admins_groups WHERE user_id = '${userId}' AND chat_id = '${chatId}'`);
        client.release();
    }

    async getAssociatedAdminGroups(userId) {
        const client = await this.pool.connect();
        const results = await client.query(`SELECT * FROM admins_groups WHERE user_id = '${userId}'`);
        client.release();
        return results.rows;
    }
    async setImmigrationLocationAndRadius(userId, location, radius) {
        try {
            const client = await this.pool.connect();
            await client.query(`DELETE FROM immigration WHERE user_id = '${userId}'`);
            await client.query(`INSERT INTO immigration VALUES (${userId}, '${JSON.stringify(location)}', ${radius})`);
            client.release();
        } catch (err) {
            console.error(err);
        }
    }

    async getLocationAndRadius(userId) {
        try {
            const client = await this.pool.connect();
            const results = await client.query(`SELECT * FROM immigration WHERE user_id = '${userId}'`);
            client.release();
            return results.rows[0];
        } catch (err) {
            console.error(err);
        }
    }
}

exports.DBFacade = DBFacade; 