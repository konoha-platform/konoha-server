const DEFAULT_PAGE = 1;
const DEFAULT_ITEMS_PER_PAGE = 10;

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginate() {
    const page = this.queryString.page * 1 || DEFAULT_PAGE;
    const limit = this.queryString.limit * 1 || DEFAULT_ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = {
  APIFeatures,
};
