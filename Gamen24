// Time:  O(n^3 * 4^n) = O(1), n = 4
// Space: O(n^2) = O(1)

class Solution {
public:
    bool judgePoint24(vector<int>& nums) {
        vector<double> doubles;
        std::transform(nums.begin(), nums.end(), std::back_inserter(doubles),
                       [](const int num) { return double(num); });
        return dfs(doubles);
    }

private:
    bool dfs(const vector<double>& nums) {
        if (nums.size() == 1) {
            return fabs(nums[0] - 24) < 1e-6;
        }
        static unordered_map<char, std::function<double(double, double)>> ops =
        {
            {'+', std::plus<double>()},
            {'-', std::minus<double>()},
            {'*', std::multiplies<double>()},
            {'/', std::divides<double>()},
        };
        for (int i = 0; i < nums.size(); ++i) {
            for (int j = 0; j < nums.size(); ++j) {
                if (i == j) {
                    continue;
                }
                vector<double> next_nums;
                for (int k = 0; k < nums.size(); ++k) {
                    if (k == i || k == j) {
                        continue;
                    }
                    next_nums.emplace_back(nums[k]);
                }
                for (const auto& op : ops) {
                    if (((op.first == '+' || op.first == '*') && i > j) ||
                        (op.first == '/' && nums[j] == 0)) {
                        continue;
                    }
                    next_nums.emplace_back(op.second(nums[i], nums[j]));
                    if (dfs(next_nums)) {
                        return true;
                    }
                    next_nums.pop_back();
                }
            }
        }
        return false;
    }
};


class Fraction {
public:
    Fraction() = default;
    Fraction(int n)
        : Fraction(n, 1)
    {
    }
    Fraction(int n, int d)
        : numerator_(n)
        , denominator_(d)
    {
    }
    ~Fraction() = default;

    void set_num(int value) { numerator_ = value; }
    void set_den(int value) { denominator_ = value; }
    int get_num() const { return numerator_; }
    int get_den() const { return denominator_; }
    void reduce();
    int calculate_gcd(int, int) const;
private:
    int numerator_, denominator_;
};

void Fraction::reduce()
{
    const auto gcd = calculate_gcd(numerator_, denominator_);
    numerator_ = numerator_ / gcd;
    denominator_ = denominator_ / gcd;
}

int Fraction::calculate_gcd(int a, int b) const
{
    a = std::abs(a);
    b = std::abs(b);
    while (b != 0) {
        int tmp = b;
        b = a % b;
        a = tmp;
    }
    return a;
}

Fraction operator+(const Fraction& lhs, const Fraction& rhs)
{
    Fraction result{};

    result.set_num((lhs.get_num() * rhs.get_den()) + (lhs.get_den() * rhs.get_num()));
    result.set_den(lhs.get_den() * rhs.get_den());

    result.reduce();

    return result;
}

Fraction operator-(const Fraction& lhs, const Fraction& rhs)
{
    Fraction result{};

    result.set_num((lhs.get_num() * rhs.get_den()) - (lhs.get_den() * rhs.get_num()));
    result.set_den(lhs.get_den() * rhs.get_den());

    result.reduce();

    return result;
}

Fraction operator*(const Fraction& lhs, const Fraction& rhs)
{
    Fraction result{};

    result.set_num(lhs.get_num() * rhs.get_num());
    result.set_den(lhs.get_den() * rhs.get_den());

    result.reduce();

    return result;
}

Fraction operator/(const Fraction& lhs, const Fraction& rhs)
{
    Fraction result{};

    result.set_num(lhs.get_num() * rhs.get_den());
    result.set_den(lhs.get_den() * rhs.get_num());

    result.reduce();

    return result;
}

bool operator==(const Fraction &lhs, const Fraction &rhs) {
    return (((lhs.get_num() * rhs.get_den()) - (rhs.get_num() * lhs.get_den())) == 0);
}

std::ostream &operator<<(std::ostream &os, const Fraction &value) {
    os << value.get_num() << "/" << value.get_den();
    return os;
}

// Time:  O(n^3 * 4^n) = O(1), n = 4
// Space: O(n^2) = O(1)
class Solution2 {
public:
    bool judgePoint24(vector<int>& nums) {
        vector<Fraction> fraction_nums;
        std::transform(nums.begin(), nums.end(), std::back_inserter(fraction_nums),
                       [](const int num) { return Fraction(num); });
        return dfs(fraction_nums);
    }

private:
    bool dfs(const vector<Fraction>& nums) {
        if (nums.size() == 1) {
            return nums[0] == 24;
        }
        static unordered_map<char, std::function<Fraction(Fraction, Fraction)>> ops =
        {
            {'+', std::plus<Fraction>()},
            {'-', std::minus<Fraction>()},
            {'*', std::multiplies<Fraction>()},
            {'/', std::divides<Fraction>()},
        };
        for (int i = 0; i < nums.size(); ++i) {
            for (int j = 0; j < nums.size(); ++j) {
                if (i == j) {
                    continue;
                }
                vector<Fraction> next_nums;
                for (int k = 0; k < nums.size(); ++k) {
                    if (k == i || k == j) {
                        continue;
                    }
                    next_nums.emplace_back(nums[k]);
                }
                for (const auto& op : ops) {
                    if (((op.first == '+' || op.first == '*') && i > j) ||
                        (op.first == '/' && nums[j] == 0)) {
                        continue;
                    }
                    next_nums.emplace_back(op.second(nums[i], nums[j]));
                    if (dfs(next_nums)) {
                        return true;
                    }
                    next_nums.pop_back();
                }
            }
        }
        return false;
    }
};
